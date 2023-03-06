// Copyright (C) 2019-2023 Aleo Systems Inc.
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

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum RecordQuery {
    /// Find records that belong to a user within a certain block range
    BlockRange {
        start: u32,
        end: u32,
        amounts: Option<Vec<u64>>,
        max_records: Option<usize>,
        max_gates: Option<u64>,
        unspent_only: bool,
    },
    /// Find records that belong to a user at a specified resource uri (e.g. a file path, database uri, etc.)
    ResourceUri {
        amounts: Option<Vec<u64>>,
        max_records: Option<usize>,
        max_gates: Option<u64>,
        query: Option<String>,
        resource: String,
        unspent_only: bool,
    },
    /// Specify options only
    Options { amounts: Option<Vec<u64>>, max_records: Option<usize>, max_gates: Option<u64>, unspent_only: bool },
    /// No-Op query for resolvers that do not support record queries
    None,
}

impl RecordQuery {
    /// Create a new block range query. Convenience method to be to query sources that have access
    /// to the aleo ledger (such as the Aleo API)
    pub fn new_block_range_query(
        start: u32,
        end: u32,
        amounts: Option<Vec<u64>>,
        max_records: Option<usize>,
        max_gates: Option<u64>,
        unspent_only: bool,
    ) -> Self {
        Self::BlockRange { start, end, amounts, max_records, max_gates, unspent_only }
    }

    /// Create a new resource uri query. Convenience method to be used with sources that have a resource
    /// uri (e.g. a file path, database uri, etc.) and a potential query string.
    ///
    /// HTTPS Example:
    /// resource: "https://vm.aleo.org/api/testnet3/"
    /// query: "block/1234"
    ///
    /// Postgres Example:
    /// resource: "postgres://user:password@localhost:5432/aleo"
    /// query: "SELECT * FROM records WHERE block_number = 1234"
    pub fn new_resource_uri_query(
        amounts: Option<Vec<u64>>,
        max_records: Option<usize>,
        max_gates: Option<u64>,
        query: Option<String>,
        resource: String,
        unspent_only: bool,
    ) -> Self {
        Self::ResourceUri { amounts, max_records, max_gates, query, resource, unspent_only }
    }

    /// Create a new options query. Convenience method to query for blocks with specific options only.
    /// This is useful for resolvers that do not extra information such as specific block ranges
    /// or specific queries to search for records.
    pub fn new_options_query(
        amounts: Option<Vec<u64>>,
        max_records: Option<usize>,
        max_gates: Option<u64>,
        unspent_only: bool,
    ) -> Self {
        Self::Options { amounts, max_records, max_gates, unspent_only }
    }

    /// Add a blank resolver
    pub fn new_none_query() -> Self {
        Self::None
    }

    /// Get the max records specified in the query
    pub fn max_records(&self) -> Option<usize> {
        match self {
            RecordQuery::BlockRange { max_records, .. } => *max_records,
            RecordQuery::ResourceUri { max_records, .. } => *max_records,
            RecordQuery::Options { max_records, .. } => *max_records,
            RecordQuery::None => None,
        }
    }

    /// Determine whether or not the query is searching for unspent records only
    pub fn unspent_only(&self) -> bool {
        match self {
            RecordQuery::BlockRange { unspent_only, .. } => *unspent_only,
            RecordQuery::ResourceUri { unspent_only, .. } => *unspent_only,
            RecordQuery::Options { unspent_only, .. } => *unspent_only,
            RecordQuery::None => false,
        }
    }

    /// Get the max gates specified in the query
    pub fn max_gates(&self) -> Option<u64> {
        match self {
            RecordQuery::BlockRange { max_gates, .. } => *max_gates,
            RecordQuery::ResourceUri { max_gates, .. } => *max_gates,
            RecordQuery::Options { max_gates, .. } => *max_gates,
            RecordQuery::None => None,
        }
    }

    /// Get the list of amounts specified in the query
    pub fn amounts(&self) -> Option<&Vec<u64>> {
        match self {
            RecordQuery::BlockRange { amounts, .. } => amounts.as_ref(),
            RecordQuery::ResourceUri { amounts, .. } => amounts.as_ref(),
            RecordQuery::Options { amounts, .. } => amounts.as_ref(),
            RecordQuery::None => None,
        }
    }
}
