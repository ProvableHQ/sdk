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

use futures::{channel::oneshot, future::try_join_all};
use rayon::ThreadBuilder;
use spmc::{channel, Receiver, Sender};
use std::future::Future;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;

#[wasm_bindgen(inline_js = r###"
    export function spawnWorker(url, module, memory, address) {
        return new Promise((resolve) => {
            const worker = new Worker(url, {
                type: "module",
            });

            worker.addEventListener("message", (event) => {
                // This is needed in Node to wait one extra tick, so that way
                // the Worker can fully initialize before we return.
                setTimeout(() => {
                    resolve(worker);

                    // When running in Node, this allows the process to exit
                    // even though the Worker is still running.
                    if (worker.unref) {
                        worker.unref();
                    }
                }, 0);
            }, {
                capture: true,
                once: true,
            });

            worker.postMessage({
                module,
                memory,
                address,
            });
        });
    }

    export function startTimer() {
        // Starts a super-long timer in order to keep the Node
        // process alive until we manually cancel it.
        return setTimeout(() => {}, Math.pow(2, 31) - 1);
    }

    export function stopTimer(timer) {
        clearTimeout(timer);
    }
"###)]
extern "C" {
    #[wasm_bindgen(js_name = spawnWorker)]
    fn spawn_worker(
        url: &web_sys::Url,
        module: &JsValue,
        memory: &JsValue,
        address: *const Receiver<ThreadBuilder>,
    ) -> js_sys::Promise;

    #[wasm_bindgen(js_name = startTimer)]
    fn start_timer() -> f64;

    #[wasm_bindgen(js_name = stopTimer)]
    fn stop_timer(timer: f64);
}

/// Runs a function on the Rayon thread-pool.
///
/// When the function returns, the Future will resolve
/// with the return value of the function.
///
/// # NodeJS
///
/// This will keep the NodeJS process alive until the
/// Future is resolved.
#[allow(dead_code)]
pub fn spawn<A, F>(f: F) -> impl Future<Output = A>
where
    A: Send + 'static,
    F: FnOnce() -> A + Send + 'static,
{
    // This is necessary in order to stop the Node process
    // from exiting while the spawned task is running.
    struct Timer(f64);

    impl Drop for Timer {
        fn drop(&mut self) {
            stop_timer(self.0);
        }
    }

    let timer = Timer(start_timer());

    let (sender, receiver) = oneshot::channel();

    rayon::spawn(move || {
        let _ = sender.send(f());
    });

    async move {
        let output = receiver.await.unwrap_throw();
        drop(timer);
        output
    }
}

async fn spawn_workers(url: web_sys::Url, num_threads: usize) -> Result<Sender<ThreadBuilder>, JsValue> {
    let module = wasm_bindgen::module();
    let memory = wasm_bindgen::memory();

    let (sender, receiver) = channel();

    let receiver = Box::leak(Box::new(receiver));

    let workers =
        try_join_all((0..num_threads).map(|_| JsFuture::from(spawn_worker(&url, &module, &memory, receiver)))).await?;

    // Needed to work around a Firefox bug where Workers get garbage collected too early
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1592227
    std::mem::forget(workers);

    Ok(sender)
}

async fn spawn_global_thread_pool(url: web_sys::Url, num_threads: usize) -> Result<(), JsValue> {
    if num_threads == 1 {
        rayon::ThreadPoolBuilder::new().num_threads(1).use_current_thread().build_global().unwrap_throw();
    } else {
        let mut sender = spawn_workers(url, num_threads).await?;

        rayon::ThreadPoolBuilder::new()
            .num_threads(num_threads)
            .spawn_handler(move |thread| {
                sender.send(thread).unwrap_throw();
                Ok(())
            })
            .build_global()
            .unwrap_throw();
    }

    Ok(())
}

pub struct ThreadPool {
    url: Option<web_sys::Url>,
    num_threads: Option<usize>,
}

impl ThreadPool {
    pub fn builder() -> Self {
        Self { url: None, num_threads: None }
    }

    pub fn url(mut self, url: web_sys::Url) -> Self {
        self.url = Some(url);
        self
    }

    pub fn num_threads(mut self, num_threads: usize) -> Self {
        self.num_threads = Some(num_threads);
        self
    }

    fn defaults(self) -> (web_sys::Url, usize) {
        (
            self.url.expect("Missing url for ThreadPool"),
            self.num_threads.unwrap_or_else(|| {
                let window: web_sys::Window = js_sys::global().unchecked_into();
                window.navigator().hardware_concurrency() as usize
            }),
        )
    }

    pub fn build_global(self) -> impl Future<Output = Result<(), JsValue>> {
        let (url, num_threads) = self.defaults();
        spawn_global_thread_pool(url, num_threads)
    }
}

#[doc(hidden)]
#[wasm_bindgen(js_name = runRayonThread)]
#[allow(clippy::not_unsafe_ptr_arg_deref)]
pub fn run_rayon_thread(receiver: *const Receiver<ThreadBuilder>)
where
    Receiver<ThreadBuilder>: Sync,
{
    // This is safe because it uses `Box::leak` so the Receiver lives forever
    let receiver = unsafe { &*receiver };
    receiver.recv().unwrap_throw().run();
}
