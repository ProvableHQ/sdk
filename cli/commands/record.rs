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

use aleo_account::ViewKey;
use aleo_record::RecordCiphertext;

use colored::Colorize;
use std::str::FromStr;
use structopt::StructOpt;

#[derive(StructOpt, Debug)]
#[structopt(setting = structopt::clap::AppSettings::ColoredHelp)]
pub enum Record {
    /// Creates a new Aleo record by attempting to decrypt a record ciphertext with a given view key.
    From {
        #[structopt(short = "c", long)]
        ciphertext: String,
        #[structopt(short = "k", long = "viewkey")]
        view_key: String,
    },
}

impl Record {
    pub fn parse(self) -> anyhow::Result<String> {
        match self {
            Self::From { ciphertext, view_key } => {
                // Parse the record ciphertext.
                let ciphertext =
                    RecordCiphertext::from_str(&ciphertext).expect("failed to parse record ciphertext string");

                // Parse the account view key.
                let view_key = ViewKey::from_str(&view_key).expect("failed to parse account view key string");

                // Decrypt the record ciphertext using the view key.
                let record = ciphertext
                    .decrypt(&view_key)
                    .expect("failed to decrypt the record with the given view key");

                // Print the Aleo record.
                let mut output = format!("\n {:>24}  {}\n", "Owner".cyan().bold(), record.owner());
                output += &format!(" {:>24}  {}\n", "Value".cyan().bold(), record.value());
                output += &format!(" {:>24}  {}\n", "Payload".cyan().bold(), record.payload());
                output += &format!(" {:>24}  {}\n", "Program ID".cyan().bold(), record.program_id());
                output += &format!(
                    " {:>24}  {}\n",
                    "Serial Number Nonce".cyan().bold(),
                    record.serial_number_nonce()
                );
                output += &format!(
                    " {:>24}  {}\n",
                    "Commitment Randomness".cyan().bold(),
                    record.commitment_randomness()
                );
                output += &format!(" {:>24}  {}\n", "Commitment".cyan().bold(), record.commitment());

                Ok(output)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::commands::Record;
    use colored::Colorize;

    pub const TEST_OWNER: &str = "aleo1evf0f0nvl3yllpj0j22j6lkewkc3c6wecfl8vy9wksdww5z4j5xs7gqklr";
    pub const TEST_VIEW_KEY: &str = "AViewKey1eUcCcmwtfgQSFnJLWht2oAtsX7hUwidF3NxbBRmtGCVQ";

    pub const TEST_RECORD_CIPHERTEXT: &str = "fe9da41a69bb6c123c5efb6eddb631f30d15afc13a16f5b0dd0e84fdc69b7d0e9716f6c7c6b408ae86f003ebbde81351c25f7d1aa2dced557a98ed0d04cefb059ba863e82aaec5038b0e93dd731ed2f4829b73867621a2e8d7398e8266269812b8e4f147f0237c46d97b447d6ef43cda46c8eeb7bd21665b44068daf6b75390397f78140b1714af29d35b33b673dc5f34368878865ad5de762142fd314fd161042418e7be64a5a10c2ab7a02f7209b90f9a9fe209eb1b6dcb5e0ac9dfd799211094d4a11d0460002c2cc7f89c1bfc927b8b25132bc7741ef920bd7e750103b0a83452b530f6fa021f10010b332d2db9b8f28bd7aa776d628a7e2872b04fd520c10016cca0ac481f7e54be1d0a0777f03acee6b5526882bb51812dbefe3df510031dd6dd4fd9d4ac9ecf37dab27471d1b52e304cefbc21872394cf0ab12734d0f";
    pub const TEST_VALUE: &str = "1234";
    pub const TEST_PAYLOAD: &str = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    pub const TEST_PROGRAM_ID: &str =
        "ap1vh5zqvkgl30p7rtjx5s3v437xs2wzfh2t44atdza4nqxn3ml4p29mgpljmh2a4srf9vxpg9gng0qqv47tt6";
    pub const TEST_SERIAL_NUMBER_NONCE: &str = "sn1xrj39r2cx0k4kc5qyc67gp6zd98gmhyy7vku6h8ghe0ry4lfpuxqtan3nn";
    pub const TEST_COMMITMENT_RANDOMNESS: &str = "cr1jawrq9myan5p06f5g5chsvwny94h4sue85zk6s023v8rhwzat5psm9gq6z";
    pub const TEST_COMMITMENT: &str = "cm1md7ew9fek0qps69z6822j7nxrn7cunhgsrhpcezqf4ql2vz32vys63394z";

    #[test]
    fn test_parse_from_string() {
        let record = Record::From {
            ciphertext: TEST_RECORD_CIPHERTEXT.to_string(),
            view_key: TEST_VIEW_KEY.to_string(),
        };
        assert!(record.parse().is_ok());
    }

    #[test]
    fn test_expected_output() {
        let mut expected = format!("\n {:>24}  {}\n", "Owner".cyan().bold(), TEST_OWNER);
        expected += &format!(" {:>24}  {}\n", "Value".cyan().bold(), TEST_VALUE);
        expected += &format!(" {:>24}  {}\n", "Payload".cyan().bold(), TEST_PAYLOAD);
        expected += &format!(" {:>24}  {}\n", "Program ID".cyan().bold(), TEST_PROGRAM_ID);
        expected += &format!(
            " {:>24}  {}\n",
            "Serial Number Nonce".cyan().bold(),
            TEST_SERIAL_NUMBER_NONCE
        );
        expected += &format!(
            " {:>24}  {}\n",
            "Commitment Randomness".cyan().bold(),
            TEST_COMMITMENT_RANDOMNESS
        );
        expected += &format!(" {:>24}  {}\n", "Commitment".cyan().bold(), TEST_COMMITMENT);

        let record = Record::From {
            ciphertext: TEST_RECORD_CIPHERTEXT.to_string(),
            view_key: TEST_VIEW_KEY.to_string(),
        };
        let actual = record.parse().unwrap();

        assert_eq!(expected, actual);
    }
}
