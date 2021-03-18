const express = require("express");
const bodyParser = require("body-parser");
const db = require("./models");
const sequelize = require("sequelize");
const axios = require("axios");
const Op = sequelize.Op;

// --------------------------------------------- //
// ------------ CONFIG FOR APPTWEAK ------------ //
const APPTWEAK_API_TOKEN = "MZ96D4I2PDCLIHU69_z4vgkjRxo";
const APPTWEAK_BASE_URL = "https://api.apptweak.com";
let config = {
  headers: {
    "X-Apptweak-Key": `${APPTWEAK_API_TOKEN}`,
  },
};

// games category
let IOS_CATEGORY_ID = 6014;
let ANDROID_CATEGORY_ID = "GAME";

let URI_IOS_TOP_GAMES = `${APPTWEAK_BASE_URL}/ios/categories/${IOS_CATEGORY_ID}/top.json`;
let URI_ANDROID_TOP_GAMES = `${APPTWEAK_BASE_URL}/android/categories/${ANDROID_CATEGORY_ID}/top.json`;

// --------------------------------------------- //
// --------------------------------------------- //

const app = express();

app.use(bodyParser.json());
app.use(express.static(`${__dirname}/static`));

// more precise to less precise (Express route exec)
app.get("/api/games/populate", async (req, res) => {
  console.log("ROUTE -> /api/games/populate");

  let axiosIOS = axios.get(URI_IOS_TOP_GAMES, config);
  let axiosANDROID = axios.get(URI_ANDROID_TOP_GAMES, config);

  try {
    let [promisedAPICallIOS, promisedAPICallAndroid] = await Promise.all([
      axiosIOS,
      axiosANDROID,
    ]);

    let firstIOSAppElements = promisedAPICallIOS.data.content
      .slice(0, 50)
      .map((elem) => ({
        publisherId: elem.developer,
        name: elem.title,
        platform: "ios",
        storeId: elem.id,
        bundleId: elem.id,
        isPublished: true,
      }));
    let firstAndroidAppElements = promisedAPICallAndroid.data.content
      .slice(0, 50)
      .map((elem) => ({
        publisherId: elem.id,
        name: elem.title,
        platform: "android",
        storeId: elem.id,
        bundleId: elem.id,
        isPublished: true,
      }));

    let topGamesApps = [...firstIOSAppElements, ...firstAndroidAppElements];

    await db.Game.bulkCreate(topGamesApps);

    res.send({status: "OK"});
  } catch (error) {
    console.log("--> error axios API call", error);
  }
});

app.get("/api/games", (req, res) =>
  db.Game.findAll()
    .then((games) => res.send(games))
    .catch((err) => {
      console.log("There was an error querying games", JSON.stringify(err));
      return res.send(err);
    })
);

app.post("/api/games", (req, res) => {
  const {
    publisherId,
    name,
    platform,
    storeId,
    bundleId,
    appVersion,
    isPublished,
  } = req.body;
  return db.Game.create({
    publisherId,
    name,
    platform,
    storeId,
    bundleId,
    appVersion,
    isPublished,
  })
    .then((game) => res.send(game))
    .catch((err) => {
      console.log("***There was an error creating a game", JSON.stringify(err));
      return res.status(400).send(err);
    });
});

app.delete("/api/games/:id", (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then((game) => game.destroy({force: true}))
    .then(() => res.send({id}))
    .catch((err) => {
      console.log("***Error deleting game", JSON.stringify(err));
      res.status(400).send(err);
    });
});

app.put("/api/games/:id", (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id).then((game) => {
    const {
      publisherId,
      name,
      platform,
      storeId,
      bundleId,
      appVersion,
      isPublished,
    } = req.body;
    return game
      .update({
        publisherId,
        name,
        platform,
        storeId,
        bundleId,
        appVersion,
        isPublished,
      })
      .then(() => res.send(game))
      .catch((err) => {
        console.log("***Error updating game", JSON.stringify(err));
        res.status(400).send(err);
      });
  });
});

app.post("/api/games/search", (req, res) => {
  // control data
  // search name -> string
  // platform ->
  // --- enum (if ts)
  // --- test includes in platformValueAllowed
  // let platformValueAllowed = ["ios, android", "all"];

  // 1 - no search --> return all
  // - normally pagination /!\
  if (
    (req.body.name === null || req.body.name === "") &&
    (req.body.platform === null || req.body.platform === "")
  ) {
    return db.Game.findAll()
      .then((games) => res.send(games))
      .catch((err) => {
        console.log("There was an error querying games", JSON.stringify(err));
        return res.send(err);
      });
  }

  // 2 - search
  // - normally pagination /!\
  if (
    (req.body.name !== null || req.body.name !== "") &&
    (req.body.platform !== null || req.body.platform !== "")
  ) {
    let query = {
      where: {},
    };

    if (req.body.name) {
      query.where = {
        name: {
          [Op.like]: `%${req.body.name}%`,
        },
      };
    }

    if (req.body.platform) {
      query.where = {
        ...query.where,
        platform: req.body.platform,
      };
    }

    return db.Game.findAll(query)
      .then((games) => res.send(games))
      .catch((err) => {
        console.log("There was an error querying games", JSON.stringify(err));
        return res.send(err);
      });
  }
});

app.listen(3000, () => {
  console.log("Server is up on port 3000");
});

module.exports = app;
