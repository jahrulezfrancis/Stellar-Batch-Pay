#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Vec};

#[contract]
pub struct BatchVestingContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VestingData {
    pub amount: i128,
    pub unlock_time: u64,
}

#[contracttype]
pub enum DataKey {
    Vesting(Address), // Recipient address
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
        sender.require_auth();

        if recipients.len() != amounts.len() {
            panic!("Recipients and amounts length mismatch");
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
            let current_vesting: Option<VestingData> = env.storage().persistent().get(&key);

            let new_vesting = match current_vesting {
                Some(mut v) => {
                    v.amount += amount;
                    v.unlock_time = core::cmp::max(v.unlock_time, unlock_time);
                    v
                }
                None => VestingData {
                    amount,
                    unlock_time,
                },
            };

            env.storage().persistent().set(&key, &new_vesting);
        }

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &total_amount);
    }

    /// Claim the vested funds.
    pub fn claim(env: Env, recipient: Address, token: Address) {
        recipient.require_auth();

        let key = DataKey::Vesting(recipient.clone());
        let mut vesting: VestingData = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("No vesting found for recipient"));

        let current_time = env.ledger().timestamp();

        if current_time < vesting.unlock_time {
            panic!("Vesting is currently locked");
        }

        let amount_to_transfer = vesting.amount;

        env.storage().persistent().remove(&key);

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(
            &env.current_contract_address(),
            &recipient,
            &amount_to_transfer,
        );
    }
}
mod test;
