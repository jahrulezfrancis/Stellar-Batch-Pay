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
    Vesting(Address), // Recipient address
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

            let key = DataKey::Vesting(recipient.clone());
            let mut vestings: Vec<VestingData> = env
                .storage()
                .persistent()
                .get(&key)
                .unwrap_or_else(|| Vec::new(&env));

            vestings.push_back(VestingData {
                amount,
                unlock_time,
                sender: sender.clone(),
            });

            env.storage().persistent().set(&key, &vestings);

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

        let key = DataKey::Vesting(recipient.clone());
        let vestings: Vec<VestingData> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("No vesting found for recipient"));

        let current_time = env.ledger().timestamp();

        let mut remaining = Vec::new(&env);
        let mut revoked_amount: i128 = 0;
        let mut schedule_sender: Option<Address> = None;
        let mut item_found = false;

        for i in 0..vestings.len() {
            let vesting = vestings.get(i).unwrap();
            if vesting.unlock_time == unlock_time && !item_found {
                item_found = true;
                if current_time >= vesting.unlock_time {
                    panic!("Cannot revoke already vested funds");
                }
                if !Self::is_authorized(&env, &caller, &vesting.sender) {
                    panic!("Unauthorized revoke attempt");
                }

                revoked_amount = vesting.amount;
                schedule_sender = Some(vesting.sender.clone());
            } else {
                remaining.push_back(vesting);
            }
        }

        if !item_found {
            panic!("Vesting schedule not found");
        }

        if revoked_amount <= 0 {
            panic!("Nothing to revoke");
        }

        if remaining.is_empty() {
            env.storage().persistent().remove(&key);
        } else {
            env.storage().persistent().set(&key, &remaining);
        }

        let sender = schedule_sender.unwrap();
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(
            &env.current_contract_address(),
            &sender,
            &revoked_amount,
        );

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
        let mut total_revoked: i128 = 0;

        for i in 0..recipients.len() {
            let recipient = recipients.get(i).unwrap();
            let key = DataKey::Vesting(recipient.clone());
            
            let vestings: Vec<VestingData> = env
                .storage()
                .persistent()
                .get(&key)
                .unwrap_or_else(|| panic!("No vesting found for recipient"));

            let mut remaining = Vec::new(&env);
            let mut revoked_amount: i128 = 0;
            let mut schedule_sender: Option<Address> = None;
            let mut item_found = false;

            for j in 0..vestings.len() {
                let vesting = vestings.get(j).unwrap();
                if vesting.unlock_time == unlock_time && !item_found {
                    item_found = true;
                    if current_time >= vesting.unlock_time {
                        panic!("Cannot revoke already vested funds");
                    }
                    if !Self::is_authorized(&env, &caller, &vesting.sender) {
                        panic!("Unauthorized revoke attempt");
                    }

                    revoked_amount = vesting.amount;
                    schedule_sender = Some(vesting.sender.clone());
                } else {
                    remaining.push_back(vesting);
                }
            }

            if !item_found {
                panic!("Vesting schedule not found");
            }

            if revoked_amount <= 0 {
                panic!("Nothing to revoke");
            }

            if remaining.is_empty() {
                env.storage().persistent().remove(&key);
            } else {
                env.storage().persistent().set(&key, &remaining);
            }

            total_revoked = total_revoked.checked_add(revoked_amount).unwrap();

            let sender = schedule_sender.unwrap();
            env.events().publish(
                (Symbol::new(&env, "VestingRevoked"),),
                (recipient, sender, revoked_amount, unlock_time),
            );
        }

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(
            &env.current_contract_address(),
            &caller,
            &total_revoked,
        );
    }

    /// Return the contract version string.
    pub fn version(env: Env) -> String {
        String::from_str(&env, "1.0.0")
    }

    /// Claim the vested funds.
    pub fn claim(env: Env, recipient: Address, token: Address) {
        Self::panic_if_paused(&env);
        recipient.require_auth();

        let key = DataKey::Vesting(recipient.clone());
        let vestings: Vec<VestingData> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("No vesting found for recipient"));

        let current_time = env.ledger().timestamp();

        let mut amount_to_transfer: i128 = 0;
        let mut remaining = Vec::new(&env);

        for i in 0..vestings.len() {
            let vesting = vestings.get(i).unwrap();
            if current_time >= vesting.unlock_time {
                amount_to_transfer = amount_to_transfer.checked_add(vesting.amount).unwrap();
            } else {
                remaining.push_back(vesting);
            }
        }

        if amount_to_transfer == 0 {
            panic!("Vesting is currently locked");
        }

        if remaining.is_empty() {
            env.storage().persistent().remove(&key);
        } else {
            env.storage().persistent().set(&key, &remaining);
        }

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(
            &env.current_contract_address(),
            &recipient,
            &amount_to_transfer,
        );

        env.events().publish(
            (Symbol::new(&env, "VestingClaimed"),),
            (recipient, amount_to_transfer),
        );
    }
}
mod test;
