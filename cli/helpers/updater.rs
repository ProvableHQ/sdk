// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo SDK library.

// The Aleo SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo SDK library. If not, see <https://www.gnu.org/licenses/>.

use crate::errors::UpdaterError;

use anyhow::Result;
use colored::Colorize;
use self_update::{backends::github, version::bump_is_greater, Status};
use std::fmt::Write as _;

pub struct Updater;

// TODO Add logic for users to easily select release versions.
impl Updater {
    const ALEO_BIN_NAME: &'static str = "aleo";
    const ALEO_REPO_NAME: &'static str = "sdk";
    const ALEO_REPO_OWNER: &'static str = "AleoHQ";

    /// Show all available releases for `aleo`.
    pub fn show_available_releases() -> Result<String> {
        let releases = github::ReleaseList::configure()
            .repo_owner(Self::ALEO_REPO_OWNER)
            .repo_name(Self::ALEO_REPO_NAME)
            .build()?
            .fetch()?;

        let mut output = "List of available versions\n".to_string();
        for release in releases {
            writeln!(output, "  * {}", release.version)?;
        }
        Ok(output)
    }

    /// Update `aleo` to the latest release.
    pub fn update_to_latest_release(show_output: bool) -> Result<Status, UpdaterError> {
        let status = github::Update::configure()
            .repo_owner(Self::ALEO_REPO_OWNER)
            .repo_name(Self::ALEO_REPO_NAME)
            .bin_name(Self::ALEO_BIN_NAME)
            .current_version(env!("CARGO_PKG_VERSION"))
            .show_download_progress(show_output)
            .no_confirm(true)
            .show_output(show_output)
            .build()?
            .update()?;

        Ok(status)
    }

    /// Check if there is an available update for `aleo` and return the newest release.
    pub fn update_available() -> Result<String, UpdaterError> {
        let updater = github::Update::configure()
            .repo_owner(Self::ALEO_REPO_OWNER)
            .repo_name(Self::ALEO_REPO_NAME)
            .bin_name(Self::ALEO_BIN_NAME)
            .current_version(env!("CARGO_PKG_VERSION"))
            .build()?;

        let current_version = updater.current_version();
        let latest_release = updater.get_latest_release()?;

        if bump_is_greater(&current_version, &latest_release.version)? {
            Ok(latest_release.version)
        } else {
            Err(UpdaterError::OldReleaseVersion(current_version, latest_release.version))
        }
    }

    /// Display the CLI message.
    #[allow(clippy::unnecessary_to_owned)]
    pub fn print_cli() -> String {
        if let Ok(latest_version) = Self::update_available() {
            let mut output = "🟢 A new version is available! Run".bold().green().to_string();
            output += &" `aleo update` ".bold().white();
            output += &format!("to update to v{latest_version}.\n").bold().green().to_string();
            output
        } else {
            String::new()
        }
    }
}
