import React, { ReactElement } from "react"

const FAQ = (): ReactElement<HTMLDivElement> => (
  <div className="c-page m-faq">
    <div className="m-faq__container">
      <h1 className="m-faq__title">About Skate</h1>
      <p>
        Skate is an active work-in-progress. In the coming months, you’ll notice
        new tools like shuttle tracking. You can also expect changes and
        refinements to the route ladders as we continue building.
      </p>
      <div className="m-faq__section">
        <h2 className="m-faq__header">Device Support</h2>
        <p>Need tablet support? Call the MBTA Help Desk at x5761.</p>
      </div>
      <div className="m-faq__section">
        <h2 className="m-faq__header">Frequently Asked Questions</h2>
        <p>
          Have questions about using Skate? We’re making updates all the time.
          Read the latest news and refresh your training by visiting our FAQ.
        </p>
        <p>
          <a
            className="m-faq__link"
            href="https://docs.google.com/document/d/e/2PACX-1vQVzXUcQWg-nKCkb8CyModNUCXDHHRxgqPdtlkm1GQOK9aCrGMSJAoC2J8JuuGFPGnPkcetrZEk6ERH/pub"
            target="_blank"
          >
            FAQ
          </a>
        </p>
      </div>
      <div className="m-faq__section">
        <h2 className="m-faq__header">Feedback</h2>
        <p>
          Have feedback, a suggestion, or need other support related to Skate?
          Use our feedback form and someone on our team will be in touch with
          you.
        </p>
        <p>
          <a
            className="m-faq__link"
            href="https://form.asana.com?hash=1a2a65ebbc7a183eb3298889a2cc9ccaf1e95cfa7a6f9ca8f226dfdb8dbb4ab0&id=1129738905260896"
            target="_blank"
          >
            Give Feedback
          </a>
        </p>
      </div>
    </div>
  </div>
)

export default FAQ
