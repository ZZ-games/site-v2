// ============================================================
//  ZZ GAMES — your game list
//  To add a game: copy a line, change the title, paste the link.
//
//  title    – name shown on the card
//  category – Racing, Sports, Arcade, Action, Puzzle, Retro, Other
//  repo     – the name of the game's repo on github.com/ZZ-games
//             (the site turns it into https://zz-games.github.io/REPO/)
//  user     – only if the repo is on a different GitHub account, e.g. "zz126j"
//  url      – OR paste a full link instead (any site) — url wins if both are set
//  image    – optional cover image, e.g. "images/slope.png"
//             (leave "" and the site makes a colorful cover for you)
//  featured – true puts it in the rotating spotlight at the top (pick a few)
//  hot      – true gives it a HOT badge and a spot in the Hot row
//  pick     – true puts it in the "Top picks" box next to the spotlight (pick 3)
//  new      – true gives it a NEW badge and a spot in the New row
//  tags     – extra search words, e.g. "gd" for Geometry Dash
//  versions – optional list of { label, url } to let players pick a version (see Retro Bowl)
// ============================================================

const SITE = {
  name: "ZZ Games",
  githubUser: "ZZ-games",
  requestFormUrl: "https://forms.gle/dwiUv1H8pbPhJFhm8", // old form (backup)
  // The "Request a game" page sends answers to your Google Form.
  // entry = the id of a paragraph question in that form, like "entry.123456789"
  // Games in the games/ folder that aren't in this copy of the site load from here instead
  
  // TMDB Read Access Token (v3 auth) for Movies/TV — https://www.themoviedb.org/settings/api
  tmdbToken: "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2ZjVlODY4NzM0YmQxMWIxYjY3NzU5YjJmMjE1ZDNiNyIsIm5iZiI6MTc5NDg2MzY3NC43MDgsInN1YiI6IjZhZmI3MjNhZjI3YTQyYmJhMTI3NTJiNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.4_0LOJOSQAiyq1HRnzvWhe1to5amc3yfem1BI0OKIE8",
  requestForm: {
    formId: "1FAIpQLSfksIhmSJWLb5yaeU3DiJLbKBItyC2tnGHBCvFPN_bd6VfPdA",
    entry: "entry.366340186",
  },
};

const GAMES = [
  { title: "Tung Tung Kart", category: "Racing", user: "ZZ-Interactives", repo: "Tung-Tung-Kart", url: "https://tung-tung-kart.netlify.app/", image: "covers/tung-tung-kart.jpg", hot: true },

  { title: "Minecraft", category: "Action", repo: "EaglerCraft", url: "https://zz-games.github.io/EaglerCraft/", image: "covers/minecraft.jpg", featured: true, hot: true, tags: "mc eaglercraft" },
  { title: "Slope", category: "Arcade", repo: "Slope", url: "https://zz-games.github.io/Slope/", image: "covers/slope.jpg", hot: true, pick: true },
  { title: "Geometry Dash Lite", category: "Arcade", repo: "geometry-dash", url: "https://zz-games.github.io/geometry-dash/", image: "covers/geometry-dash-lite.jpg", tags: "gd" },
  { title: "Stickman Hook", category: "Arcade", repo: "Stickman-Hook", url: "https://zz-games.github.io/Stickman-Hook/", image: "covers/stickman-hook.jpg" },
  { title: "Block Blasts", category: "Puzzle", repo: "Block-Blast", url: "https://zz-games.github.io/Block-Blast/", image: "covers/block-blasts.jpg" },
  { title: "Redline Rush", category: "Racing", repo: "Redline-Rush", url: "https://zz-games.github.io/Redline-Rush/", image: "covers/redline-rush.jpg", featured: true, new: true },
  { title: "Basket Random", category: "Sports", repo: "Basket-Random", url: "https://zz-games.github.io/Basket-Random/", image: "covers/basket-random.jpg" },
  { title: "Cluster Rush", category: "Arcade", user: "zz126j", repo: "Cluster-Rush", url: "https://zz126j.github.io/Cluster-Rush/", image: "covers/cluster-rush.jpg" },
  { title: "Drive Mad", category: "Racing", repo: "drive-mad", url: "https://zz-games.github.io/drive-mad/", image: "covers/drive-mad.jpg" },
  { title: "Table Tennis World Tour", category: "Sports", repo: "Table-Tennis-World-Tour", url: "https://zz-games.github.io/Table-Tennis-World-Tour/", image: "covers/table-tennis-world-tour.jpg" },
  { title: "Retro Bowl", category: "Sports", repo: "retro-bowl", url: "https://zz-games.github.io/retro-bowl/", image: "covers/retro-bowl.jpg", featured: true, hot: true, tags: "rb football", pick: true,
    versions: [
      { label: "Normal", url: "https://zz-games.github.io/retro-bowl/" },
      { label: "Hacked", url: "https://zz-games.github.io/Retro-Bowl-Glitched-/", note: "999 coaching credits and free upgrades. Saves separately from Normal." },
    ] },
  { title: "Retro Bowl College", category: "Sports", repo: "Retro-Bowl-College", url: "https://zz-games.github.io/Retro-Bowl-College/", image: "covers/retro-bowl-college.jpg" },
  { title: "Slow Roads", category: "Racing", repo: "slow-roads", url: "https://zz-games.github.io/slow-roads/", image: "covers/slow-roads.jpg" },
  { title: "Soccer Random", category: "Sports", repo: "Soccer-Random", url: "https://zz-games.github.io/Soccer-Random/", image: "covers/soccer-random-2.jpg" },
  { title: "Volley Random", category: "Sports", repo: "Volley-Random", url: "https://zz-games.github.io/Volley-Random/", image: "covers/volley-random-2.jpg" },
  { title: "Boxing Random", category: "Sports", repo: "Boxing-Random", url: "https://zz-games.github.io/Boxing-Random/", image: "covers/boxing-random-2.jpg" },
  { title: "Krillion", category: "Puzzle", repo: "Open-Krillion.io", url: "https://zz-games.github.io/Open-Krillion.io/", image: "covers/krillion.jpg" },
  { title: "Summer Rider", category: "Racing", user: "zz126j", repo: "SummerRider", url: "https://zz126j.github.io/SummerRider/", image: "covers/summer-rider.jpg" },
  { title: "Snow Rider", category: "Racing", user: "zz126j", repo: "SnowRider", url: "https://zz126j.github.io/SnowRider/", image: "covers/snow-rider.jpg" },
  { title: "Ragdoll Archers", category: "Action", repo: "RagdollArchers", url: "https://zz-games.github.io/RagdollArchers/", image: "covers/ragdoll-archers.jpg" },
  { title: "Rooftop Run", category: "Arcade", repo: "Rooftop-Run", url: "https://zz-games.github.io/Rooftop-Run/", image: "covers/rooftop-run.jpg" },
  { title: "Moto Road Rash 3D", category: "Racing", repo: "MotoRoadRash3D", url: "https://zz-games.github.io/MotoRoadRash3D/", image: "covers/moto-road-rash-3d.jpg" },
  { title: "Survival Race", category: "Racing", repo: "Survival-Race", url: "https://zz-games.github.io/Survival-Race/", image: "covers/survival-race.jpg" },
  { title: "PolyTrack", category: "Racing", repo: "polytrack2", url: "https://zz-games.github.io/polytrack2/", image: "covers/polytrack.jpg" },
  { title: "Drift Boss", category: "Racing", repo: "Drift-Boss", url: "https://zz-games.github.io/Drift-Boss/", image: "covers/drift-boss.jpg", imagePos: "8% center", hot: true },
  { title: "Subway Surfers", category: "Arcade", repo: "subway-surfers", url: "https://zz-games.github.io/subway-surfers/", image: "covers/subway-surfers.jpg", hot: true, pick: true },
  { title: "Apple Worm", category: "Puzzle", repo: "Apple-Worm", url: "https://zz-games.github.io/Apple-Worm/", image: "covers/apple-worm.jpg" },
  { title: "Escape Road", category: "Racing", repo: "Escape-Road", url: "https://zz-games.github.io/Escape-Road/", image: "covers/escape-road.jpg" },
  { title: "Hole.io", category: "Arcade", repo: "Hole.io", url: "https://zz-games.github.io/Hole.io/", image: "covers/hole-io.jpg" },
  { title: "Dunk Shot", category: "Sports", repo: "Dunk-Shot", url: "https://zz-games.github.io/Dunk-Shot/", image: "covers/dunk-shot.jpg" },
  { title: "Moto X3M", category: "Racing", repo: "MotoX3M", url: "https://zz-games.github.io/MotoX3M/", image: "covers/moto-x3m.jpg" },
  { title: "Fly the Plane", category: "Arcade", user: "zz126j", repo: "Fly-the-plane", url: "https://zz126j.github.io/Fly-the-plane/", image: "covers/fly-the-plane.jpg" },
  { title: "Among Us", category: "Action", repo: "Among-Us", url: "https://zz-games.github.io/Among-Us/", image: "covers/among-us.jpg" },
  { title: "Super Liquid Soccer", category: "Sports", repo: "Super-Liquid-Soccer", url: "https://zz-games.github.io/Super-Liquid-Soccer/", image: "covers/super-liquid-soccer.jpg" },
  { title: "Wrestle Bros", category: "Sports", repo: "WrestleBros", url: "https://zz-games.github.io/WrestleBros/", image: "covers/wrestle-bros.jpg" },
  { title: "Ramp Car vs Police", category: "Racing", user: "zz126j", repo: "Ramp-Car-vs-Police", url: "https://zz126j.github.io/Ramp-Car-vs-Police/", image: "covers/ramp-car-vs-police.jpg" },
  { title: "Basketball Stars", category: "Sports", repo: "Basketball-Stars", url: "https://zz-games.github.io/Basketball-Stars/", image: "covers/basketball-stars.jpg", hot: true },
  { title: "Draw Climber", category: "Puzzle", repo: "Draw-Climber", url: "https://zz-games.github.io/Draw-Climber/", image: "covers/draw-climber.jpg" },
  { title: "Blaze Drifter", category: "Racing", repo: "Blaze-Drifters-", url: "https://zz-games.github.io/Blaze-Drifters-/", image: "covers/blaze-drifter.jpg" },
  { title: "Mad Pursuit", category: "Racing", user: "zz126j", repo: "Mad-Pursuit", url: "https://zz126j.github.io/Mad-Pursuit/", image: "covers/mad-pursuit.jpg" },
  { title: "Football Bros", category: "Sports", repo: "FootballBros", url: "https://zz-games.github.io/FootballBros/", image: "covers/football-bros.jpg" },
  { title: "Soccer Bros", category: "Sports", repo: "SoccerBros", url: "https://zz-games.github.io/SoccerBros/", image: "covers/soccer-bros.jpg" },
  { title: "Baseball Bros", category: "Sports", repo: "BaseballBros", url: "https://zz-games.github.io/BaseballBros/", image: "covers/baseball-bros.jpg" },
  { title: "Google Snake", category: "Retro", repo: "Snake-Game-Goog", url: "https://zz-games.github.io/Snake-Game-Goog/", image: "covers/google-snake.jpg" },
  { title: "Sky Race 3D", category: "Racing", repo: "Sky-Race-3d", url: "https://zz-games.github.io/Sky-Race-3d/", image: "covers/sky-race-3d.jpg" },
  { title: "Stack Ball", category: "Arcade", repo: "Stack-Ball-io", url: "https://zz-games.github.io/Stack-Ball-io/", image: "covers/stack-ball.jpg" },
  { title: "Google Doodle Baseball", category: "Retro", repo: "Google-Doodle-Baseball", url: "https://zz-games.github.io/Google-Doodle-Baseball/", image: "covers/google-doodle-baseball.jpg" },
  { title: "Mr. Car Racer", category: "Racing", repo: "Mr-Car-Racer", url: "https://zz-games.github.io/Mr-Car-Racer/", image: "covers/mr-car-racer.jpg" },
  { title: "Blackjack", category: "Other", repo: "Blackjack", url: "https://zz-games.github.io/Blackjack/", image: "covers/blackjack.jpg" },
  { title: "Stickman Duel", category: "Action", repo: "StickmanDuel", url: "https://zz-games.github.io/StickmanDuel/", image: "covers/stickman-duel.jpg" },
  { title: "Bad Piggies", category: "Puzzle", repo: "Bad-Piggies", url: "https://zz-games.github.io/Bad-Piggies/", image: "covers/bad-piggies.jpg" },
  { title: "Golf Battle", category: "Sports", repo: "Golf-Battle", url: "https://zz-games.github.io/Golf-Battle/", image: "covers/golf-battle.jpg" },
  { title: "Jetski Race", category: "Racing", repo: "Jetski-Race", url: "https://zz-games.github.io/Jetski-Race/", image: "covers/jetski-race.jpg" },
  { title: "Tall.io", category: "Arcade", repo: "tall-io", url: "https://zz-games.github.io/tall-io/", image: "covers/tall-io.jpg" },
  { title: "Crazy Plane Landing", category: "Arcade", repo: "Crazy-Plane-Landing", url: "https://zz-games.github.io/Crazy-Plane-Landing/", image: "covers/crazy-plane-landing.jpg" },
  { title: "Five Nights at Freddy's", category: "Action", repo: "FNAF", url: "https://zz-games.github.io/FNAF/", image: "covers/five-nights-at-freddy-s.jpg", tags: "fnaf" },
  { title: "Money Rush", category: "Arcade", repo: "Money-Rush", url: "https://zz-games.github.io/Money-Rush/", image: "covers/money-rush.jpg" },
  { title: "Grass Mowing Simulator", category: "Other", repo: "Stone-Grass-Mowing-Simulator", url: "https://zz-games.github.io/Stone-Grass-Mowing-Simulator/", image: "covers/grass-mowing-simulator.jpg" },
  { title: "Elytra Flight", category: "Arcade", repo: "Elytra-Flight", url: "https://zz-games.github.io/Elytra-Flight/", image: "covers/elytra-flight.jpg" },
  { title: "Crazy Motorcycle", category: "Racing", repo: "Crazy-Motercycle", url: "https://zz-games.github.io/Crazy-Motercycle/", image: "covers/crazy-motorcycle.jpg" },
  { title: "Crossy Road", category: "Arcade", repo: "Crossy-Road", url: "https://zz-games.github.io/Crossy-Road/", image: "covers/crossy-road.jpg" },
  { title: "Suika Game", category: "Puzzle", repo: "Suika-game", url: "https://zz-games.github.io/Suika-game/", image: "covers/suika-game.jpg" },
  { title: "Dune Dash", category: "Racing", repo: "Dune-Dash", url: "https://zz-games.github.io/Dune-Dash/", image: "covers/dune-dash.jpg" },
  { title: "Cut the Rope", category: "Puzzle", repo: "CutTheRope", url: "https://zz-games.github.io/CutTheRope/", image: "covers/cut-the-rope.jpg" },
  { title: "Tanuki Sunset", category: "Racing", repo: "Tanuki-Sunset", url: "https://zz-games.github.io/Tanuki-Sunset/", image: "covers/tanuki-sunset.jpg" },
  { title: "Angry Birds", category: "Puzzle", repo: "Angry-Birds", url: "https://zz-games.github.io/Angry-Birds/", image: "covers/angry-birds.jpg" },
  { title: "Icy Purple Head", category: "Puzzle", repo: "Icy-Purple-Head", url: "https://zz-games.github.io/Icy-Purple-Head/", image: "covers/icy-purple-head.jpg" },
  { title: "BitLife", category: "Other", repo: "bitlife", url: "https://zz-games.github.io/bitlife/", image: "covers/bitlife.jpg" },
  { title: "Poly Billiards", category: "Sports", user: "zz126j", repo: "Poly-Billiards", url: "https://zz126j.github.io/Poly-Billiards/", image: "covers/poly-billiards.jpg" },
  { title: "Tower Crash 3D", category: "Arcade", repo: "Tower-Crash-3d", url: "https://zz-games.github.io/Tower-Crash-3d/", image: "covers/tower-crash-3d.jpg" },
  { title: "Highway Traffic 3D", category: "Racing", repo: "HighwayTraffic3D", url: "https://zz-games.github.io/HighwayTraffic3D/", image: "covers/highway-traffic-3d.jpg" },
  { title: "OvO", category: "Arcade", repo: "OvO", url: "https://zz-games.github.io/OvO/", image: "covers/ovo.jpg" },
  { title: "Paper.io 2", category: "Arcade", repo: "Paperio2", url: "https://zz-games.github.io/Paperio2/", image: "covers/paper-io-2.jpg", imagePos: "center 20%", hot: true },
  { title: "Cookie Clicker", category: "Other", repo: "CookieClicker", url: "https://zz-games.github.io/CookieClicker/", image: "covers/cookie-clicker.jpg" },
  { title: "Knife Hit", category: "Arcade", repo: "Knife-Hit", url: "https://zz-games.github.io/Knife-Hit/", image: "covers/knife-hit-2.jpg" },
  { title: "Super Knife", category: "Action", repo: "Super-Knife", url: "https://zz-games.github.io/Super-Knife/", image: "covers/super-knife-2.jpg" },
  { title: "Contra", category: "Retro", repo: "Contra", url: "https://zz-games.github.io/Contra/", image: "covers/contra.jpg", new: true },
  { title: "Candy Crush", category: "Puzzle", repo: "Candy-Crush", url: "https://zz-games.github.io/Candy-Crush/", image: "covers/candy-crush-2.jpg", new: true },
  { title: "Chain Pop", category: "Puzzle", repo: "Chain-Pop", url: "https://zz-games.github.io/Chain-Pop/", image: "covers/chain-pop-2.jpg", new: true },
  { title: "Idle Miner Tycoon", category: "Other", repo: "Idle-Miner-Tycoon", url: "https://zz-games.github.io/Idle-Miner-Tycoon/", image: "covers/idle-miner-tycoon.jpg", new: true },
  { title: "Time Shooter 2", category: "Action", repo: "Time-Shooter-2", url: "https://zz-games.github.io/Time-Shooter-2/", image: "covers/time-shooter-2.jpg", new: true },
  { title: "Hill Climb Racing", category: "Racing", repo: "Hill-Climb", url: "https://zz-games.github.io/Hill-Climb/", image: "covers/hill-climb.jpg", new: true },
  { title: "Jetpack Joyride", category: "Arcade", repo: "Jetpack-Joyride", url: "https://zz-games.github.io/Jetpack-Joyride/", image: "covers/jetpack-joyride.jpg", new: true },
  { title: "Stick Merge", category: "Action", repo: "Stick-Merge", url: "https://zz-games.github.io/Stick-Merge/", image: "covers/stick-merge.jpg", new: true },
  { title: "Crazy Cattle 3D", category: "Action", repo: "Crazy-Cattle-3D", url: "https://zz-games.github.io/Crazy-Cattle-3D/", image: "covers/crazy-cattle-3d.jpg", new: true, featured: true },

  // No link yet — add a url (or repo) and remove the // to put these on the site
  // { title: "Henry Stickman", category: "Action", repo: "", url: "", image: "covers/henry-stickman.jpg" },
  // { title: "Snowball.io", category: "Arcade", repo: "", url: "", image: "covers/snowball-io.jpg" },
  // { title: "Fruit Ninja", category: "Arcade", repo: "", url: "", image: "covers/fruit-ninja.jpg" },
  // { title: "World's Hardest Game", category: "Puzzle", repo: "", url: "", image: "covers/world-s-hardest-game.jpg" },
];
