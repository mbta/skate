import React, { ReactElement } from "react"

const AboutPage = (): ReactElement<HTMLDivElement> => (
  <div className="c-page c-page--about">
    <div className="c-page__container">
      <h1 className="c-page__title">About Skate</h1>
      <p>
        Skate is an active work-in-progress. In the coming months, you’ll notice
        new tools like shuttle tracking. You can also expect changes and
        refinements to the route ladders as we continue building.
      </p>
      <div className="c-page__section">
        <h2 className="c-page__header">Device Support</h2>
        <p>Need tablet support? Call the MBTA Help Desk at x5761.</p>
      </div>
      <div className="c-page__section">
        <h2 className="c-page__header">Frequently Asked Questions</h2>
        <p>
          Have questions about using Skate? We’re making updates all the time.
          Read the latest news and refresh your training by visiting our FAQ.
        </p>
        <p>
          <a
            className="c-page__link"
            href="https://docs.google.com/document/d/e/2PACX-1vQVzXUcQWg-nKCkb8CyModNUCXDHHRxgqPdtlkm1GQOK9aCrGMSJAoC2J8JuuGFPGnPkcetrZEk6ERH/pub"
            target="_blank"
          >
            FAQ
          </a>
        </p>
      </div>
      <div className="c-page__section">
        <h2 className="c-page__header">Feedback</h2>
        <p>
          Have feedback, a suggestion, or need other support related to Skate?
          Use our feedback form and someone on our team will be in touch with
          you.
        </p>
        <p>
          <a
            className="c-page__link"
            href="https://form.asana.com?hash=e0ca8ee9a5fbde7691ba0ff428c826eba5a9700b99249e26124dd33d13b511ca&id=1155343357379913"
            target="_blank"
          >
            Give Feedback
          </a>
        </p>
      </div>
    </div>
  </div>
)

export default AboutPage
