console.log("LOADING SERVICE WORKER")

self.addEventListener('push', (event) => {
  const promiseChain = 
    Promise.resolve(console.log(event))
    .then(() => {
      console.log(event.data.json())
      return event.data.json()
    })
    .then((data) =>
      self.registration.showNotification(
        `Hello, ${data.username}.`,
        {body: `Shuttles currently in operation: ${data.n_shuttles}`}
      )
    );
  event.waitUntil(promiseChain);
});
