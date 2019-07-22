import React, { ReactElement } from "react"

const FAQ = (): ReactElement<HTMLDivElement> => (
  <div className="c-page m-faq">
    <h1>Frequently Asked Questions about Skate</h1>
    <h2>The Basics</h2>
    <h3>What is Skate?</h3>
    <p>
      Skate is a bus tracking tool that inspectors can use on MBTA-issued
      Samsung tablets or any other machine with web access. The first version
      includes <strong>route ladders and is available now.</strong> Skate is
      meant to give bus inspectors timely information that helps you keep
      service running well for MBTA riders. It’s a collaboration between MBTA
      Bus Operations and the Customer Technology Department.
    </p>
    <h3>Does it just do route ladders? </h3>
    <p>
      We are actively developing and improving Skate. You can expect to see
      <strong>
        new features for headway management, shuttle tracking, changing bus
        labels from vehicle IDs to run IDs or badge numbers, and schedules in
        the coming months.
      </strong>{" "}
      We welcome input on features and tweaks that would be useful to you.
    </p>
    <h3>
      What’s the difference between Skate, Swiftly, TransitMaster/Citrix, and
      Samsara?
    </h3>
    <p>
      Skate includes route ladders similar to those in TransitMaster/Citrix,
      with several improvements and upcoming features based on conversations we
      had with bus inspectors and other MBTA staff. Unlike TransitMaster/Citrix,
      Skate can be accessed on MBTA-issued Samsung tablets or any other device
      with an internet connection (computers, phones, etc.). It also includes
      high-frequency bus locations from the Samsara trackers installed on all
      buses, as well as the operator/run/status info from TransitMaster units.
      We encourage you to use Skate because it’s an MBTA (not a vendor)
      application and we have full control of the features. That means we tweak
      and improve this tool to make sure it’s the best tool possible for you and
      other MBTA staff.
    </p>
    <p>
      <em>TransitMaster</em> is the MBTA’s computer-aided dispatching system
      that is used by operators (units in buses), dispatchers at OCC, and
      officials and helps us track our vehicles and service. It does a lot
      “behind the scenes,” including managing bus/OCC radio comms, but also
      includes dispatcher tools like Playback and BusOps (e.g., route ladders, a
      schedule tab, and a roster tab). <em>Citrix</em> is a way of accessing
      TransitMaster and is usable on desktop computers, old Citrix handhelds,
      but not tablets or phones.
    </p>
    <p>
      <em>Swiftly</em> is the MBTA’s vendor for real-time bus predictions, but
      also includes a live map of bus service that is available to bus
      officials. Its web-based dashboard allows you to track scheduled bus (not
      shuttle) service in real time and replay historical vehicle movements (by
      route or by an individual vehicle). The vehicles appear on a map, not on
      route ladders. The dashboard can be accessed on mobile phones, tablets,
      and computers, although it works much better on a computer with a large
      screen.
    </p>
    <p>
      <em>Samsara</em> is the vendor of the new GPS devices on each of the
      buses. Samsara supplements the less-frequent location updates we get from
      TransitMaster. Samsara also has a nice tracking dashboard that bus
      maintenance uses because it includes bus location but also vehicle
      diagnostic data. Ops and instruction staff are welcome to also use it,
      even though it doesn’t have the operator/work information present in
      TransitMaster and Swiftly.
    </p>
    <h3>Where/how could I provide feedback on Skate? </h3>
    <p>
      We definitely want to hear from you and other bus inspectors!{" "}
      <a href="https://www.mbta.com/skate-feedback">Fill out a form</a> if
      you’re experiencing an error, or have a question or ideas for improvement.
      We’ll do our best to respond as quickly as possible to the email address
      you provide. Soon we’ll also send out a survey you could fill out to help
      us evaluate the usability of the tool and ultimately improve it.
    </p>
    <h3>How do I request help for my tablet?</h3>
    <p>
      If you want training or help with your Samsung tablet, call the MBTA Help
      Desk at x5761 and ask them to assign the ticket to the “Realtime
      Applications Team” with a callback number that works for you. We’ll reach
      out to schedule a time with you. If you just need help obtaining or
      resetting your email password, the Help Desk should be able to help you on
      the phone right there.
    </p>
    <h2>SKATE SPECIFICS</h2>
    <h3>Can I “save” or “add” my preferred routes?</h3>
    <p>
      Not yet, but it’s a feature that is high on our priority list. We’re
      working on saving your most-viewed/selected routes to the local browser
      storage, which will mean you will no longer have to re-open your selected
      routes after your tablet falls asleep. Keep an eye out!
    </p>
    <h3>
      Is there a maximum number of route ladders I can have open on Skate?
    </h3>
    <p>
      It depends. We suggest having no more than 9-10 open route ladders on a
      tablet. A computer has more power and will be able to handle more ladders
      at once, but Skate is expected to get slower as more routes ladders are
      open.
    </p>
    <h3>Can I filter my ladders by garage/station/timepoint/etc?</h3>
    <p>
      Unfortunately not yet. This is a helpful feature offered by Swiftly. We’re
      working on adding the option to filter routes by timepoint, garage,
      inspector post, and stop.
    </p>
    <h3>Can I track shuttle buses on Skate?</h3>
    <p>
      You will be able to very soon! Once we launch this feature in the coming
      months you’ll be able to track shuttles by run number and view shuttle
      routes in a map view. We’ll have a training session once we roll out
      shuttle tracking to make sure you’re all set up to use it optimally.
    </p>
    <h3>What do the different colored icons mean?</h3>
    <p>
      <span className="m-faq--early">Red icon</span>: early
    </p>
    <p>
      <span className="m-faq--on-time">Green icon</span>: on-time
    </p>
    <p>
      <span className="m-faq--late">Blue icon</span>: late
    </p>
    <p>
      <strong>Black icon</strong>: invalid and/or off-course
    </p>
    <p>
      <strong>White Ghost icon</strong>: ghost bus -- not tracking or dropped
      trip
    </p>

    <h3>Can I customize the color scheme to my preference?</h3>
    <p>
      We don’t offer this option at the moment, but you might see it added at
      some point. Stay tuned!
    </p>
  </div>
)

export default FAQ
