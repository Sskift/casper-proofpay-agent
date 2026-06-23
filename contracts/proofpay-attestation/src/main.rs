#![no_std]
#![no_main]

extern crate alloc;

use alloc::{format, string::String};
use casper_contract::contract_api::{runtime, storage};
use casper_types::{Key, URef};
use core::panic::PanicInfo;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}

const ARG_MILESTONE_ID: &str = "milestone_id";
const ARG_EVIDENCE_HASH: &str = "evidence_hash";
const ARG_DECISION: &str = "decision";
const ARG_DECISION_HASH: &str = "decision_hash";
const ARG_CONFIDENCE: &str = "confidence";
const ARG_RISK_SCORE: &str = "risk_score";
const KEY_PREFIX: &str = "proofpay_attestation";

fn attestation_key(milestone_id: &str) -> String {
    format!("{}_{}", KEY_PREFIX, milestone_id)
}

fn store_attestation(record_key: String, record: String) {
    let record_ref: URef = storage::new_uref(record);
    let record_key_value: Key = record_ref.into();
    runtime::put_key(record_key.as_str(), record_key_value);
}

#[no_mangle]
pub extern "C" fn call() {
    let milestone_id: String = runtime::get_named_arg(ARG_MILESTONE_ID);
    let evidence_hash: String = runtime::get_named_arg(ARG_EVIDENCE_HASH);
    let decision: String = runtime::get_named_arg(ARG_DECISION);
    let decision_hash: String = runtime::get_named_arg(ARG_DECISION_HASH);
    let confidence: u64 = runtime::get_named_arg(ARG_CONFIDENCE);
    let risk_score: u64 = runtime::get_named_arg(ARG_RISK_SCORE);

    let record = format!(
        "{{\"milestone_id\":\"{}\",\"evidence_hash\":\"{}\",\"decision\":\"{}\",\"decision_hash\":\"{}\",\"confidence\":{},\"risk_score\":{}}}",
        milestone_id,
        evidence_hash,
        decision,
        decision_hash,
        confidence,
        risk_score
    );

    store_attestation(attestation_key(milestone_id.as_str()), record);
}
