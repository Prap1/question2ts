import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import express from "express";
import { TypedResponse } from "express";
import { hostname } from "os";
import { InstancePingResponse } from "./ping.route";
// you didn't send ping.route file
chai.use(chaiHttp);

const apiServer = express();
apiServer.use(express.json());

apiServer.get(
  "/api/v1/ping",
  async (req, res: TypedResponse<InstancePingResponse>) => {
    res.send({
      ping: "pong!",
      instance: {
        id: hostname(),
        name: "Instance",
        description: "This is an instance",
        image: null,
        correspondenceEmail: null,
        correspondenceUserID: null,
        frontPage: null,
        tosPage: null,
      },
    });
  }
);

apiServer.post("/api/v1/ping", async (req, res) => {
  const { body } = req;
  if (!body || !body.data) {
    res.status(400).json({ message: "Invalid input" });
  } else {
    res.json({ message: "Success" });
  }
});

describe("Ping API Test Suite", function () {
  this.timeout(8 * 1000);

  before(async function () {
    // Perform any setup or initialization tasks
  });

  it("should get instance's health status", async function () {
    return chai
      .request(apiServer)
      .get("/api/v1/ping")
      .then(function (res) {
        expect(res.status).to.equal(200);
        expect(res.body.ping).to.equal("pong!");
      });
  });

  it("should return 404 for non-existing route", async function () {
    return chai
      .request(apiServer)
      .get("/api/v1/non-existing-route")
      .then(function (res) {
        expect(res.status).to.equal(404);
        expect(res.body.message).to.equal("Route not found");
      });
  });

  it("should return an error when ping endpoint fails", async function () {
    // Mock the behavior of the ping endpoint to simulate an error
    const originalGet = chai.request(apiServer).get;
    chai.request(apiServer).get = jest.fn(() => {
      throw new Error("Internal server error");
    });

    return chai
      .request(apiServer)
      .get("/api/v1/ping")
      .then(function (res) {
        expect(res.status).to.equal(500);
        expect(res.body.error).to.equal("Internal server error");

        // Restore the original behavior of the ping endpoint
        chai.request(apiServer).get = originalGet;
      });
  });

  it("should return a 204 No Content response when there is no data to return", async function () {
    // Mock the behavior of the ping endpoint to return no data
    const originalGet = chai.request(apiServer).get;
    chai.request(apiServer).get = jest.fn().resolves({ status: 204 });

    return chai
      .request(apiServer)
      .get("/api/v1/ping")
      .then(function (res) {
        expect(res.status).to.equal(204);
        expect(res.body).to.be.empty;

        // Restore the original behavior of the ping endpoint
        chai.request(apiServer).get = originalGet;
      });
  });

  it("should return a 400 Bad Request for invalid input", async function () {
    return chai
      .request(apiServer)
      .post("/api/v1/ping")
      .send({ invalid: "input" })
      .then(function (res) {
        expect(res.status).to.equal(400);
        expect(res.body.message).to.equal("Invalid input");
      });
  });

  after(async function () {
    // Perform any cleanup or teardown tasks
    await apiServer.close();
  });
});
