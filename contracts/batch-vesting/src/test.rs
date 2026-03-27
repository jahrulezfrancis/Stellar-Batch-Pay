#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events, Ledger},
    token, Address, Env, IntoVal, String, Symbol, Vec,
};
use token::Client as TokenClient;
use token::StellarAssetClient as TokenAdminClient;

fn create_token_contract<'a>(
    env: &Env,
    admin: &Address,
) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let contract_id = env.register_stellar_asset_contract(admin.clone());
    (
        TokenClient::new(env, &contract_id),
        TokenAdminClient::new(env, &contract_id),
    )
}

#[test]
fn test_version() {
    let env = Env::default();
    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);
    assert_eq!(client.version(), String::from_str(&env, "1.0.0"));
}

#[test]
fn test_deposit_and_claim() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);

    token_admin_client.mint(&sender, &1000);

    let recipients = Vec::from_array(&env, [recipient1.clone(), recipient2.clone()]);
    let amounts = Vec::from_array(&env, [100, 200]);
    let unlock_time = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });

    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);

    assert_eq!(token.balance(&sender), 700);
    assert_eq!(token.balance(&contract_id), 300);

    env.ledger().with_mut(|li| {
        li.timestamp = 1001;
    });

    client.claim(&recipient1, &token.address);
    assert_eq!(token.balance(&recipient1), 100);
    assert_eq!(token.balance(&contract_id), 200);

    client.claim(&recipient2, &token.address);
    assert_eq!(token.balance(&recipient2), 200);
    assert_eq!(token.balance(&contract_id), 0);
}

#[test]
fn test_revoke_by_sender() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&sender, &1000);

    let recipients = Vec::from_array(&env, [recipient.clone()]);
    let amounts = Vec::from_array(&env, [100]);
    let unlock_time = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });

    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);

    env.ledger().with_mut(|li| {
        li.timestamp = 500;
    });

    client.revoke(&sender, &recipient, &token.address, &unlock_time);

    assert_eq!(token.balance(&sender), 1000);
    assert_eq!(token.balance(&contract_id), 0);
}

#[test]
#[should_panic(expected = "No vesting found for recipient")]
fn test_claim_after_revoke_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&sender, &1000);

    let recipients = Vec::from_array(&env, [recipient.clone()]);
    let amounts = Vec::from_array(&env, [100]);
    let unlock_time = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });

    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);
    env.ledger().with_mut(|li| {
        li.timestamp = 500;
    });
    client.revoke(&sender, &recipient, &token.address, &unlock_time);

    client.claim(&recipient, &token.address);
}

#[test]
fn test_revoke_by_admin() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let admin = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&sender, &1000);

    client.set_admin(&admin);

    let recipients = Vec::from_array(&env, [recipient.clone()]);
    let amounts = Vec::from_array(&env, [100]);
    let unlock_time = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });
    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);

    env.ledger().with_mut(|li| {
        li.timestamp = 500;
    });

    client.revoke(&admin, &recipient, &token.address, &unlock_time);

    assert_eq!(token.balance(&sender), 1000);
    assert_eq!(token.balance(&contract_id), 0);
}

#[test]
#[should_panic(expected = "Unauthorized revoke attempt")]
fn test_revoke_unauthorized() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let attacker = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&sender, &1000);

    let recipients = Vec::from_array(&env, [recipient.clone()]);
    let amounts = Vec::from_array(&env, [100]);
    let unlock_time = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });

    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);

    env.ledger().with_mut(|li| {
        li.timestamp = 500;
    });

    client.revoke(&attacker, &recipient, &token.address, &unlock_time);
}

#[test]
#[should_panic(expected = "Cannot revoke already vested funds")]
fn test_revoke_already_vested() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&sender, &1000);

    let recipients = Vec::from_array(&env, [recipient.clone()]);
    let amounts = Vec::from_array(&env, [100]);
    let unlock_time = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });

    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    client.revoke(&sender, &recipient, &token.address, &unlock_time);
}

#[test]
#[should_panic(expected = "Vesting is currently locked")]
fn test_claim_too_early() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);

    token_admin_client.mint(&sender, &1000);

    let recipients = Vec::from_array(&env, [recipient1.clone()]);
    let amounts = Vec::from_array(&env, [100]);
    let unlock_time = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });

    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);

    // Try to claim before unlock_time
    env.ledger().with_mut(|li| {
        li.timestamp = 500;
    });

    client.claim(&recipient1, &token.address);
}

#[test]
#[should_panic]
fn test_claim_unauthorized() {
    let env = Env::default();
    // NOT calling env.mock_all_auths() here
    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let recipient = Address::generate(&env);
    let token = Address::generate(&env);

    // This should fail because recipient hasn't authorized the call
    client.claim(&recipient, &token);
}

#[test]
#[should_panic(expected = "No vesting found for recipient")]
fn test_claim_no_vesting() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let recipient = Address::generate(&env);
    let token = Address::generate(&env);

    client.claim(&recipient, &token);
}

#[test]
#[should_panic]
fn test_deposit_unauthorized() {
    let env = Env::default();
    // NOT calling env.mock_all_auths() here
    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let token = Address::generate(&env);
    let recipients = Vec::from_array(&env, [Address::generate(&env)]);
    let amounts = Vec::from_array(&env, [100]);
    let unlock_time = 1000;

    // This should fail because sender hasn't authorized the call
    client.deposit(&sender, &token, &recipients, &amounts, &unlock_time);
}

#[test]
fn test_events_emission() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);

    token_admin_client.mint(&sender, &1000);

    let recipients = Vec::from_array(&env, [recipient1.clone(), recipient2.clone()]);
    let amounts = Vec::from_array(&env, [100, 200]);
    let unlock_time: u64 = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });

    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);

    // Verify VestingDeposited events
    let deposit_events = env.events().all();
    let deposit_symbol = Symbol::new(&env, "VestingDeposited");
    let mut deposit_found = 0;

    for (contract, topics, data) in deposit_events.iter() {
        if contract == contract_id && topics.len() == 1 {
            let topic: Symbol = topics.get(0).unwrap().into_val(&env);
            if topic == deposit_symbol {
                let (evt_sender, evt_recipient, evt_amount, evt_unlock): (Address, Address, i128, u64) = data.into_val(&env);
                assert_eq!(evt_sender, sender);
                assert_eq!(evt_unlock, unlock_time);
                if evt_recipient == recipient1 {
                    assert_eq!(evt_amount, 100);
                    deposit_found += 1;
                } else if evt_recipient == recipient2 {
                    assert_eq!(evt_amount, 200);
                    deposit_found += 1;
                }
            }
        }
    }
    assert_eq!(deposit_found, 2, "Should find 2 deposit events with correct data");

    // Advance time and claim 1
    env.ledger().with_mut(|li| {
        li.timestamp = 1001;
    });

    client.claim(&recipient1, &token.address);
    let claim1_events = env.events().all();
    let claim_symbol = Symbol::new(&env, "VestingClaimed");
    let mut claim1_found = false;

    for (contract, topics, data) in claim1_events.iter() {
        if contract == contract_id && topics.len() == 1 {
            let topic: Symbol = topics.get(0).unwrap().into_val(&env);
            if topic == claim_symbol {
                let (evt_recipient, evt_amount): (Address, i128) = data.into_val(&env);
                assert_eq!(evt_recipient, recipient1);
                assert_eq!(evt_amount, 100);
                claim1_found = true;
            }
        }
    }
    assert!(claim1_found, "Should find claim event for recipient1");

    // Claim 2
    client.claim(&recipient2, &token.address);
    let claim2_events = env.events().all();
    let mut claim2_found = false;

    for (contract, topics, data) in claim2_events.iter() {
        if contract == contract_id && topics.len() == 1 {
            let topic: Symbol = topics.get(0).unwrap().into_val(&env);
            if topic == claim_symbol {
                let (evt_recipient, evt_amount): (Address, i128) = data.into_val(&env);
                assert_eq!(evt_recipient, recipient2);
                assert_eq!(evt_amount, 200);
                claim2_found = true;
            }
        }
    }
    assert!(claim2_found, "Should find claim event for recipient2");
}

#[test]
fn test_multiple_vestings_different_unlocks() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);

    token_admin_client.mint(&sender, &1000);

    let recipients = Vec::from_array(&env, [recipient.clone()]);

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });

    let amounts_first = Vec::from_array(&env, [100]);
    let unlock_time_first = 1000;
    client.deposit(
        &sender,
        &token.address,
        &recipients,
        &amounts_first,
        &unlock_time_first,
    );

    let amounts_second = Vec::from_array(&env, [300]);
    let unlock_time_second = 2000;
    client.deposit(
        &sender,
        &token.address,
        &recipients,
        &amounts_second,
        &unlock_time_second,
    );

    assert_eq!(token.balance(&sender), 600);
    assert_eq!(token.balance(&contract_id), 400);

    // First vesting should be claimable without affecting the later one.
    env.ledger().with_mut(|li| {
        li.timestamp = 1001;
    });

    client.claim(&recipient, &token.address);
    assert_eq!(token.balance(&recipient), 100);
    assert_eq!(token.balance(&contract_id), 300);

    // Second vesting unlocks later.
    env.ledger().with_mut(|li| {
        li.timestamp = 2001;
    });

    client.claim(&recipient, &token.address);
    assert_eq!(token.balance(&recipient), 400);
    assert_eq!(token.balance(&contract_id), 0);
}

#[test]
fn test_batch_revoke_by_sender() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    let recipient3 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&sender, &1000);

    let recipients = Vec::from_array(&env, [recipient1.clone(), recipient2.clone(), recipient3.clone()]);
    let amounts = Vec::from_array(&env, [100, 200, 300]);
    let unlock_time = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });

    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);

    assert_eq!(token.balance(&sender), 400);
    assert_eq!(token.balance(&contract_id), 600);

    env.ledger().with_mut(|li| {
        li.timestamp = 500;
    });

    let revoke_recipients = Vec::from_array(&env, [recipient1.clone(), recipient2.clone()]);
    client.batch_revoke(&sender, &revoke_recipients, &token.address, &unlock_time);

    assert_eq!(token.balance(&sender), 700);
    assert_eq!(token.balance(&contract_id), 300);
}

#[test]
fn test_batch_revoke_by_admin() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    let admin = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&sender, &1000);

    client.set_admin(&admin);

    let recipients = Vec::from_array(&env, [recipient1.clone(), recipient2.clone()]);
    let amounts = Vec::from_array(&env, [150, 250]);
    let unlock_time = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });
    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);

    env.ledger().with_mut(|li| {
        li.timestamp = 500;
    });

    client.batch_revoke(&admin, &recipients, &token.address, &unlock_time);

    assert_eq!(token.balance(&admin), 400);
    assert_eq!(token.balance(&contract_id), 0);
}

#[test]
#[should_panic(expected = "Unauthorized revoke attempt")]
fn test_batch_revoke_unauthorized() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    let attacker = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&sender, &1000);

    let recipients = Vec::from_array(&env, [recipient1.clone(), recipient2.clone()]);
    let amounts = Vec::from_array(&env, [100, 200]);
    let unlock_time = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });

    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);

    env.ledger().with_mut(|li| {
        li.timestamp = 500;
    });

    client.batch_revoke(&attacker, &recipients, &token.address, &unlock_time);
}

#[test]
#[should_panic(expected = "Cannot revoke already vested funds")]
fn test_batch_revoke_already_vested() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&sender, &1000);

    let recipients = Vec::from_array(&env, [recipient1.clone(), recipient2.clone()]);
    let amounts = Vec::from_array(&env, [100, 200]);
    let unlock_time = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });

    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    client.batch_revoke(&sender, &recipients, &token.address, &unlock_time);
}

#[test]
#[should_panic(expected = "No vesting found for recipient")]
fn test_batch_revoke_no_vesting() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, _) = create_token_contract(&env, &token_admin);

    let recipients = Vec::from_array(&env, [recipient1.clone(), recipient2.clone()]);
    let unlock_time = 1000;

    client.batch_revoke(&sender, &recipients, &token.address, &unlock_time);
}

#[test]
fn test_batch_revoke_events_emission() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&sender, &1000);

    let recipients = Vec::from_array(&env, [recipient1.clone(), recipient2.clone()]);
    let amounts = Vec::from_array(&env, [100, 200]);
    let unlock_time: u64 = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });

    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);

    env.ledger().with_mut(|li| {
        li.timestamp = 500;
    });

    client.batch_revoke(&sender, &recipients, &token.address, &unlock_time);

    let revoke_events = env.events().all();
    let revoke_symbol = Symbol::new(&env, "VestingRevoked");
    let mut revoke_found = 0;

    for (contract, topics, data) in revoke_events.iter() {
        if contract == contract_id && topics.len() == 1 {
            let topic: Symbol = topics.get(0).unwrap().into_val(&env);
            if topic == revoke_symbol {
                let (evt_recipient, evt_sender, evt_amount, evt_unlock): (Address, Address, i128, u64) = data.into_val(&env);
                assert_eq!(evt_sender, sender);
                assert_eq!(evt_unlock, unlock_time);
                if evt_recipient == recipient1 {
                    assert_eq!(evt_amount, 100);
                    revoke_found += 1;
                } else if evt_recipient == recipient2 {
                    assert_eq!(evt_amount, 200);
                    revoke_found += 1;
                }
            }
        }
    }
    assert_eq!(revoke_found, 2, "Should find 2 revoke events with correct data");
}

#[test]
fn test_batch_revoke_partial_recipients() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, BatchVestingContract);
    let client = BatchVestingContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    let recipient3 = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let (token, token_admin_client) = create_token_contract(&env, &token_admin);
    token_admin_client.mint(&sender, &1000);

    let recipients = Vec::from_array(&env, [recipient1.clone(), recipient2.clone(), recipient3.clone()]);
    let amounts = Vec::from_array(&env, [100, 200, 300]);
    let unlock_time = 1000;

    env.ledger().with_mut(|li| {
        li.timestamp = 0;
    });

    client.deposit(&sender, &token.address, &recipients, &amounts, &unlock_time);

    env.ledger().with_mut(|li| {
        li.timestamp = 500;
    });

    let revoke_recipients = Vec::from_array(&env, [recipient1.clone()]);
    client.batch_revoke(&sender, &revoke_recipients, &token.address, &unlock_time);

    assert_eq!(token.balance(&sender), 500);
    assert_eq!(token.balance(&contract_id), 500);

    env.ledger().with_mut(|li| {
        li.timestamp = 1001;
    });

    client.claim(&recipient2, &token.address);
    assert_eq!(token.balance(&recipient2), 200);

    client.claim(&recipient3, &token.address);
    assert_eq!(token.balance(&recipient3), 300);
}
