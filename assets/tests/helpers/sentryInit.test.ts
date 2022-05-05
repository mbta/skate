import sentryInit from "../../src/helpers/sentryInit"

const opts = {
	environment: "test_env"
}

test("Sentry Init runs", () => {
    expect(
      sentryInit(opts)
    ).toHaveProperty("environment", "test_env")
 })