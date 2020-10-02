import "whatwg-fetch"

export const browserSupportsPush = (): boolean => {
  return "serviceWorker" in navigator && "PushManager" in window
}

// This function is awkward because some browsers' implementations of
// requestPermission take a callback, others return a promise, so we
// have to cover both methods.
export const askPermission = () => {
  return new Promise((resolve, reject) => {
    const permissionResult = Notification.requestPermission((result) => {
      resolve(result)
    })

    if (permissionResult) {
      permissionResult.then(resolve, reject)
    }
  }).then((permissionResult) => {
    if (permissionResult !== "granted") {
      throw new Error("We weren't granted permission.")
    }
  })
}

export const subscribeUserToPush = (): void => {
  navigator.serviceWorker.register("/service_worker.js")
  navigator.serviceWorker.ready
    .then((registration) => {
      console.log("REGISTRATION SUCCESSFUL")
      console.log(registration)

      const publicKey =
        "BOI28VqmZHiQADYnj2swJQAYypNp9xyhsuTAzZgs8GQn-5aqxbvQsxcbL1hDw3jvlHoCV5PP5p-golUXrlkaLu8"

      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }

      return registration.pushManager.subscribe(subscribeOptions)
    })
    .then((pushSubscription) => {
      console.log("PUSH SUBSCRIPTION")
      console.log(pushSubscription)

      const csrfToken: string = (document.getElementsByName(
        "csrf-token"
      )[0] as HTMLMetaElement).content

      return fetch("/api/subscribe_to_spike", {
        method: "POST",
        body: JSON.stringify(pushSubscription),
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
      })
    })
    .catch((err) => {
      console.error("FAILED REGISTRATION")
      console.error(err)
    })
}

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
