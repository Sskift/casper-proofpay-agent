use odra::prelude::*;

#[odra::module]
pub struct ProofPayAttestation {
    records: Mapping<String, String>,
}

#[odra::module]
impl ProofPayAttestation {
    pub fn attest(
        &mut self,
        milestone_id: String,
        evidence_hash: String,
        decision: String,
        decision_hash: String,
        confidence: u64,
        risk_score: u64,
    ) {
        let record = alloc::format!(
            "{{\"milestone_id\":\"{}\",\"evidence_hash\":\"{}\",\"decision\":\"{}\",\"decision_hash\":\"{}\",\"confidence\":{},\"risk_score\":{}}}",
            milestone_id,
            evidence_hash,
            decision,
            decision_hash,
            confidence,
            risk_score
        );

        self.records.set(&milestone_id, record);
    }

    pub fn get(&self, milestone_id: String) -> Option<String> {
        self.records.get(&milestone_id)
    }
}
