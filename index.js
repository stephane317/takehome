const express = require("express");
const bodyParser = require("body-parser");
const db = require("./models");
const Sequelize = require("sequelize");

const Op = Sequelize.Op;

const app = express();

app.use(bodyParser.json());
app.use(express.static(`${__dirname}/static`));

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
  console.log("---> route api/games/seach");
  console.log("----> req", req.body);

  let platformValueAllowed = ["ios, android", "all"];

  // control data
  // search -> string
  // platform ->
  // --- enum (if ts)
  // --- test includes in platformValueAllowed

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
