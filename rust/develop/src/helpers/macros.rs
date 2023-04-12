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

/// Spawn a blocking tokio task
#[macro_export]
macro_rules! spawn_blocking {
    ($($tt:tt)*) => {
        tokio::task::spawn_blocking(move || $($tt)*.or_reject())
    };
}

/// Spawn a blocking tokio task and await its result (used for proof computation)
#[macro_export]
macro_rules! await_task {
    ($($tt:tt)*) => {
        (tokio::task::spawn_blocking(move || $($tt)*.or_reject())).await.or_reject()?
    };
}

/// Await a streaming task
#[macro_export]
macro_rules! await_streaming_task {
    ($future:expr, $timeout:expr, $message:literal, $tx:expr) => {{
        let task = spawn_blocking!($future);
        let mut timer = 0f32;
        while !task.is_finished() {
            sleep(Duration::from_millis(500)).await;
            timer += 0.5;
            if timer > $timeout {
                task.abort();
                $tx.send(StreamState::Timeout).await.or_reject()?;
                return Err(reject::custom(RestError::Request(format!("{} - {}", $message, "reason: timeout"))));
            }
        }
        let result = task.await.or_reject()?;
        if result.is_err() {
            $tx.send(StreamState::Error).await.or_reject()?;
            return Err(reject::custom(RestError::Request(format!("{} - {}", $message, "reason: error"))));
        }
        result
    }};
}
