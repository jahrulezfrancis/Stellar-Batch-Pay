#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, String, Symbol, Vec};

#[contract]
pub struct BatchVestingContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VestingData {
    pub amount: i128,
    pub unlock_time: u64,
    pub sender: Address,
}

#[contracttype]
pub enum DataKey {
    Vesting(Address, u32), // (recipient, index) — granular per-schedule key
    VestingCount(Address), // total number of schedules for a recipient
    Admin,
    Paused,
}

impl BatchVestingContract {
    fn get_admin(env: &Env) -> Option<Address> {
        env.storage().persistent().get(&DataKey::Admin)
    }

    fn set_admin_internal(env: &Env, admin: &Address) {
        env.storage().persistent().set(&DataKey::Admin, admin);
    }

    fn is_authorized(env: &Env, caller: &Address, schedule_sender: &Address) -> bool {
        let is_sender = caller == schedule_sender;
        let is_admin = match Self::get_admin(env) {
            Some(a) => caller == &a,
            None => false,
        };
        is_sender || is_admin
    }

    fn is_paused(env: &Env) -> bool {
        env.storage().persistent().get(&DataKey::Paused).unwrap_or(false)
    }

    fn panic_if_paused(env: &Env) {
        if Self::is_paused(env) {
            panic!("Contract is paused");
        }
    }

    /// Returns the current schedule count for a recipient.
    fn get_count(env: &Env, recipient: &Address) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::VestingCount(recipient.clone()))
            .unwrap_or(0u32)
    }

    /// Appends a new vesting schedule for a recipient and returns its index.
    fn push_vesting(env: &Env, recipient: &Address, data: &VestingData) -> u32 {
        let idx = Self::get_count(env, recipient);
        env.storage()
            .persistent()
            .set(&DataKey::Vesting(recipient.clone(), idx), data);
        env.storage()
            .persistent()
            .set(&DataKey::VestingCount(recipient.clone()), &(idx + 1));
        idx
    }

    /// Reads a single vesting schedule by index. Panics if missing.
    fn get_vesting(env: &Env, recipient: &Address, idx: u32) -> VestingData {
        env.storage()
            .persistent()
            .get(&DataKey::Vesting(recipient.clone(), idx))
            .unwrap_or_else(|| panic!("Vesting schedule not found"))
    }

    /// Removes a schedule by swapping it with the last entry (O(1) removal).
    fn remove_vesting(env: &Env, recipient: &Address, idx: u32) {
        let count = Self::get_count(env, recipient);
        let last = count - 1;
        if idx != last {
            // Move last entry into the removed slot
            let last_data = Self::get_vesting(env, recipient, last);
            env.storage()
                .persistent()
                .set(&DataKey::Vesting(recipient.clone(), idx), &last_data);
        }
        env.storage()
            .persistent()
            .remove(&DataKey::Vesting(recipient.clone(), last));
        if last == 0 {
            env.storage()
                .persistent()
                .remove(&DataKey::VestingCount(recipient.clone()));
        } else {
            env.storage()
                .persistent()
                .set(&DataKey::VestingCount(recipient.clone()), &last);
        }
    }
}

#[contractimpl]
impl BatchVestingContract {
    /// Initialize a batch of vestings.
    pub fn deposit(
        env: Env,
        sender: Address,
        token: Address,
        recipients: Vec<Address>,
        amounts: Vec<i128>,
        unlock_time: u64,
    ) {
        Self::panic_if_paused(&env);
        sender.require_auth();

        if recipients.len() != amounts.len() {
            panic!("Recipients and amounts length mismatch");
        }

        if unlock_time <= env.ledger().timestamp() {
            panic!("Unlock time must be in the future");
        }

        let mut total_amount: i128 = 0;

        for i in 0..recipients.len() {
            let recipient = recipients.get(i).unwrap();
            let amount = amounts.get(i).unwrap();

            if amount <= 0 {
                panic!("Amount must be positive");
            }

            total_amount = total_amount.checked_add(amount).unwrap();

            Self::push_vesting(
                &env,
                &recipient,
                &VestingData {
                    amount,
                    unlock_time,
                    sender: sender.clone(),
                },
            );

            env.events().publish(
                (Symbol::new(&env, "VestingDeposited"),),
                (sender.clone(), recipient, amount, unlock_time),
            );
        }

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &total_amount);
    }

    /// Set admin for the contract. Only the first call can set the admin.
    pub fn set_admin(env: Env, admin: Address) {
        admin.require_auth();
        if Self::get_admin(&env).is_some() {
            panic!("Admin already set");
        }
        Self::set_admin_internal(&env, &admin);
    }

    /// Toggle contract pause state. Only admin can toggle pause.
    pub fn toggle_pause(env: Env, admin: Address, paused: bool) {
        admin.require_auth();
        let stored_admin = Self::get_admin(&env).expect("Admin must be set to toggle pause");
        if admin != stored_admin {
            panic!("Only admin can toggle pause");
        }
        env.storage().persistent().set(&DataKey::Paused, &paused);

        env.events().publish(
            (Symbol::new(&env, "PauseToggled"),),
            (admin, paused),
        );
    }

    /// Revoke unvested schedule by recipient/unlock time.
    pub fn revoke(
        env: Env,
        caller: Address,
        recipient: Address,
        token: Address,
        unlock_time: u64,
    ) {
        Self::panic_if_paused(&env);
        caller.require_auth();

        let count = Self::get_count(&env, &recipient);
        if count == 0 {
            panic!("No vesting found for recipient");
        }

        let current_time = env.ledger().timestamp();
        let mut found_idx: Option<u32> = None;
        let mut revoked_amount: i128 = 0;
        let mut schedule_sender: Option<Address> = None;

        for i in 0..count {
            let vesting = Self::get_vesting(&env, &recipient, i);
            if vesting.unlock_time == unlock_time {
                if current_time >= vesting.unlock_time {
                    panic!("Cannot revoke already vested funds");
                }
                if !Self::is_authorized(&env, &caller, &vesting.sender) {
                    panic!("Unauthorized revoke attempt");
                }
                revoked_amount = vesting.amount;
                schedule_sender = Some(vesting.sender.clone());
                found_idx = Some(i);
                break;
            }
        }

        if found_idx.is_none() {
            panic!("Vesting schedule not found");
        }

        Self::remove_vesting(&env, &recipient, found_idx.unwrap());

        let sender = schedule_sender.unwrap();
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &sender, &revoked_amount);

        env.events().publish(
            (Symbol::new(&env, "VestingRevoked"),),
            (recipient, sender, revoked_amount, unlock_time),
        );
    }

    /// Revoke unvested schedules for multiple recipients in a single transaction.
    pub fn batch_revoke(
        env: Env,
        caller: Address,
        recipients: Vec<Address>,
        token: Address,
        unlock_time: u64,
    ) {
        Self::panic_if_paused(&env);
        caller.require_auth();

        let current_time = env.ledger().timestamp();

        for i in 0..recipients.len() {
            let recipient = recipients.get(i).unwrap();

            let count = Self::get_count(&env, &recipient);
            if count == 0 {
                panic!("No vesting found for recipient");
            }

            let mut found_idx: Option<u32> = None;
            let mut revoked_amount: i128 = 0;
            let mut schedule_sender: Option<Address> = None;

            for j in 0..count {
                let vesting = Self::get_vesting(&env, &recipient, j);
                if vesting.unlock_time == unlock_time {
                    if current_time >= vesting.unlock_time {
                        panic!("Cannot revoke already vested funds");
                    }
                    if !Self::is_authorized(&env, &caller, &vesting.sender) {
                        panic!("Unauthorized revoke attempt");
                    }
                    revoked_amount = vesting.amount;
                    schedule_sender = Some(vesting.sender.clone());
                    found_idx = Some(j);
                    break;
                }
            }

            if found_idx.is_none() {
                panic!("Vesting schedule not found");
            }

            Self::remove_vesting(&env, &recipient, found_idx.unwrap());

            let sender = schedule_sender.unwrap();
            let token_client = token::Client::new(&env, &token);
            token_client.transfer(&env.current_contract_address(), &sender, &revoked_amount);

            env.events().publish(
                (Symbol::new(&env, "VestingRevoked"),),
                (recipient, sender, revoked_amount, unlock_time),
            );
        }
    }

    /// Return the contract version string.
    pub fn version(env: Env) -> String {
        String::from_str(&env, "1.0.0")
    }

    /// Claim the vested funds.
    pub fn claim(env: Env, recipient: Address, token: Address) {
        Self::panic_if_paused(&env);
        recipient.require_auth();

        let count = Self::get_count(&env, &recipient);
        if count == 0 {
            panic!("No vesting found for recipient");
        }

        let current_time = env.ledger().timestamp();
        let mut amount_to_transfer: i128 = 0;

        // Collect claimable indices first (iterate in reverse to safely remove via swap)
        let mut claimable: Vec<u32> = Vec::new(&env);
        for i in 0..count {
            let vesting = Self::get_vesting(&env, &recipient, i);
            if current_time >= vesting.unlock_time {
                amount_to_transfer = amount_to_transfer.checked_add(vesting.amount).unwrap();
                claimable.push_back(i);
            }
        }

        if amount_to_transfer == 0 {
            panic!("Vesting is currently locked");
        }

        // Remove claimable entries in reverse index order to keep swap-removal consistent
        let claimable_len = claimable.len();
        for k in (0..claimable_len).rev() {
            let idx = claimable.get(k).unwrap();
            // Re-read current count since it shrinks with each removal
            let current_count = Self::get_count(&env, &recipient);
            // The swap-remove may have moved a previously-unvisited entry into `idx`.
            // Since we collected indices before any removal and iterate in reverse,
            // indices >= current removal point are still valid.
            if idx < current_count {
                Self::remove_vesting(&env, &recipient, idx);
            }
        }

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &recipient, &amount_to_transfer);

        env.events().publish(
            (Symbol::new(&env, "VestingClaimed"),),
            (recipient, amount_to_transfer),
        );
    }
}
mod test;
