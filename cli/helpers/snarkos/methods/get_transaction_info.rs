// Copyright (C) 2019-2021 Aleo Systems Inc.
// This file is part of the Aleo library.

// The Aleo library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo library. If not, see <https://www.gnu.org/licenses/>.

use crate::helpers::snarkos::{
    errors::RpcRequestError,
    methods::SnarkOSRpcMethod,
    objects::{RequestBody, RpcRequest, TransactionInfo},
    rpc::RpcClient,
};

use uuid::Uuid;

pub struct GetTransactionInfoRequest {
    body: RequestBody,
}

impl GetTransactionInfoRequest {
    pub fn new(id: Option<Uuid>, transaction_id: String) -> Self {
        let body = RequestBody::new(id, SnarkOSRpcMethod::GetTransactionInfo.to_string(), vec![
            serde_json::Value::String(transaction_id),
        ]);

        GetTransactionInfoRequest { body }
    }
}

impl RpcRequest for GetTransactionInfoRequest {
    type Output = TransactionInfo;

    fn id(&self) -> Uuid {
        self.body.id
    }

    fn body(&self) -> &RequestBody {
        &self.body
    }

    fn auth_required(&self) -> bool {
        false
    }
}

pub async fn get_block_hash(
    connection: &RpcClient,
    transaction_id: String,
) -> Result<TransactionInfo, RpcRequestError> {
    connection
        .request(&GetTransactionInfoRequest::new(None, transaction_id))
        .await
}

#[cfg(test)]
mod tests {
    pub use super::*;
    use crate::helpers::snarkos::rpc::RpcAuth;

    use tokio::runtime::Runtime;
    use wiremock::{
        matchers::{method, path},
        Mock,
        MockServer,
        ResponseTemplate,
    };

    #[test]
    fn test_get_transaction_info() {
        // Create the runtime
        let rt = Runtime::new().unwrap();

        rt.block_on(async {
            // Setup mock server
            let mock_server = MockServer::start().await;

            // Create mock request
            let response_body: serde_json::Value = serde_json::from_str(r#"{
                "jsonrpc": "2.0",
                "result": {
                    "digest": "09ad79ed197ab2323f62d50f616a2e62b0ff598ad1fd32932e15e7853213b201",
                    "encrypted_records": [
                        "0841ad8eb642c4a2475e2d6c3548f445253db290842531d9b5e25effe74d3eee03c097f5273f56517fe1615100f820577619242101568ddc5da5972b7b7c1c760a6969ddc7ed39cd774a18bc15d5cf38c6d59df1d14e05add65f0e4e6a54b2c901f1580a556f9e9f8e438cdb0d92fa0da1642816eb9318c14387be499d7481950847131dbb8496d3dcc58811dfa96df2bd2ad769cb69438bb1a2657625686b140f1196bfe7a292673f8502acc9cd1ac30f0d16342759105882b3026dafa030320285daefd9fde6dc65dd33541452b43a3bf17e57cf2f147392edc8f8c65af3850020b79c96609743cbfd0b21249265c84344e1c993b480cd042e296d66c17bc7056500",
                        "086b4be9b0c757451bb495c6eefb7f90c03cb06578b6e59ce3edcd99e52ddc140fa75042d3b5c97e0f07f204e71961f42daacb4657f49472e9ee2a49dc4240570399490a3ebbba9846e7481a4ff03f7af4850a9083ff339f638641089401d3f4069930064b88e624e25bcfc34ac4a2145ce47fe7acdaaaf34855db677c467d900e18d25110add36e7684752408b6daa7adb4f00fb2632c8009fe295922b0dc9a03b72e8fbabc7e190c603117eae63e37467719d17d0184cbd7697ef5ef09fe2105363fec1c9abae40bbe9303bc1b6f621266e1efea81fbc129724d51eaf857bb0f8b04951392cf3eb8611f588f37775aaa8695da3334ee22ed09642d780089ea01dd00"
                    ],
                    "local_data_root": "325b0c32c99c7a3e725c6cada4ed7b785ba14ca9dcfd33165cf03f318667740b",
                    "memo": "7634552e26d3f4016aabd21df1f2d4e416df769e8bc3354cbc44c61b8236853a",
                    "network_id": 0,
                    "new_commitments": [
                        "2ffd75e3e518853ef2328b72b29cda505241bf26b264e85cb12556e3d4556b03",
                        "a0a8907b83ef4eaccc1c8131727451d336ffdcd3a7c6e82544a3b93421c43a05"
                    ],
                    "old_serial_numbers": [
                        "a71516317b97cb52c9f35a242213f17d23564480d1418c4bb2bafe66f629e082",
                        "6decfb5bad2908341b2ff2bc49f0bbf546a7222a8fdb7aa7fe56867b6bf9d609"
                    ],
                    "program_commitment": "35ef15d0a6a94c668efd2b7b4675f6c2c3d635be65c542728cf2d10719aa77e2",
                    "signatures": [
                        "38b000a0e63cd95ac30164d61a9f09c44c10c264a9b785c4fa9348a53235ae02976d8df8bdaa922291448b870890b8d51201021e6af7b63e5edbd00573b6f201",
                        "84f5b35453a3e2558e01d2f42a63820febab9714ee039120885092edeabed0025c9b5a4df699537106cb90e1c7db1744664ab4204921163480557a5be8cf6a02"
                    ],
                    "size": 1538,
                    "transaction_metadata": {
                        "block_number": 0
                    },
                    "transaction_proof": "9f73a3adb98c49ed607b74c977660fb67522cb9dec3e3fe1f3ace6c9f8fa8ed06059351d33175604af93f27c728b273771b6a1e1026100738cbcbd03dfca92ebc2c8f05711a70ae4129bc4287d193011e764d4cb9881dc9296b7795c61929900993dbca095301ab39f9d16ba35dd5dd8b10af88bed55d2ccde4325b4616240d60cf796f3debec7c5ec66d8674d41023c136a040ff560f28e8f556fc6eacad77080edef73bc2d26cece61dd57f044f3f7da146d94982a2ea521a8f5a049026100004f7b65dbc89a3b4b4de34d157a851ac4ebbfef41efc0d1c933995a53c640b0d1c3c7b1d4106cb074b8e88a8099cae134409b37df21dbea6c6387384dc402ebc7144c2bfe8ac7d53ec702bf1a11c2a0e2870e8eb3ce34ddd22fee1ce531c510002b07453ee75f4465714103dde334d6cf53e99cf209aa7128b5cf33f3050f317943993efd0397fecd3ce307dc837c5e92614deb96cef45e2658386043a7d1e5847c05afeff384910a82438760f06c4c08b23de5433ec5bd98e9b3bd080ef9e0000062bd16d5ef7e0c3f8f9920c80a75a8c54d38a3c3293289400b6ea4edc92eb7e42362127aa7acd08b33ebda84fcdb14f0e4494ff1f43938492b231f1af437998c82fb6e629861221a413a74b057ee76dfa5411158a2b06359a0527997ca488100298a0d1001ca85e30c6b29992ff4f3890942e2be8012e661631d6b2dfa64939e77d5e2d8b5eeb4db36137b73fe0572de5da3c3ae629e13d48096c0fb5a54c2c3bc47bd98895df81edc1195b50350e821436abe97f2919482afe4af93dcbc230000",
                    "txid": "cb9f08d50a8876ac6523928932b4a4341a2f315ea768df37b54495fbc38b1d1e",
                    "value_balance": -100
                },
                "id": "655c462d-717b-4f08-8b07-23fcb2d3ed8a"
            }"#).unwrap();

            Mock::given(method("POST"))
                .and(path("/".to_string()))
                .respond_with(ResponseTemplate::new(200).set_body_json(response_body))
                .mount(&mock_server)
                .await;

            // Set up connection to mock server
            let snarkos_connection = RpcClient::new(mock_server.uri(), RpcAuth::None);

            // Make a request to the mock server
            let transaction_info = snarkos_connection
                .request(&GetTransactionInfoRequest::new(Some(
                    Uuid::parse_str("655c462d-717b-4f08-8b07-23fcb2d3ed8a").unwrap(),
                ), "d1cd52113e16e83cc19468533f4a721debf9dbd2e029774efda09c25947af319".to_string()))
                .await
                .unwrap();

            assert_eq!("cb9f08d50a8876ac6523928932b4a4341a2f315ea768df37b54495fbc38b1d1e", &transaction_info.txid);
            assert_eq!("09ad79ed197ab2323f62d50f616a2e62b0ff598ad1fd32932e15e7853213b201", &transaction_info.digest);
            assert_eq!("7634552e26d3f4016aabd21df1f2d4e416df769e8bc3354cbc44c61b8236853a", &transaction_info.memo);
            assert_eq!([
                           "38b000a0e63cd95ac30164d61a9f09c44c10c264a9b785c4fa9348a53235ae02976d8df8bdaa922291448b870890b8d51201021e6af7b63e5edbd00573b6f201",
                           "84f5b35453a3e2558e01d2f42a63820febab9714ee039120885092edeabed0025c9b5a4df699537106cb90e1c7db1744664ab4204921163480557a5be8cf6a02"
                       ].to_vec(), transaction_info.signatures);

        });
    }
}
