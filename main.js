import "./style.css";
import { collectionID, databaseID, databases } from "./appwrite";
import { Query } from "appwrite";

const K = 20;

function main() {
  getIds();
}

async function executeLeaderBoard(filteredLeaderBoard) {
   document
    .querySelector("#leaderboard-icon")
    .addEventListener("click", async () => {
     
      document.body.innerHTML = `
    <div id="back" onClick="window.location.reload()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="96" opacity="0.2"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="88" y1="128" x2="168" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="120 96 88 128 120 160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg></div>
    <div class="container">
      <div class="leaderboard">
        <div class="head">
          <i class="fas fa-crown"></i>
          <h1>Leaderboard</h1>
        </div>
        <div class="body" style="max-height:281px; overflow-y:scroll;">
          <ol>
            ${filteredLeaderBoard
              .map(
                (e) => `
              <li>
                <div>
                  <img class="leaderboard-img" src="${e.profile_image}" />
                  <mark>${e.name}</mark>
                </div>
                <small>${e.face_rating}</small>
              </li>
            `
              )
              .join("")}
          </ol>
        </div>
      </div>
    </div>`;
    });
}
function calculateExpectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function updateRating(currentRating, expectedScore, actualScore) {
  return currentRating + K * (actualScore - expectedScore);
}

async function getIds() {
  try {
    const result = await databases.listDocuments(databaseID, collectionID,[
    Query.orderDesc("face_rating"),
    Query.limit(600),
  ]);

    const { documents } = result;
    const refinedData = documents.map((user) => user.$id);

    let randomFirst =
      refinedData[Math.floor(Math.random() * refinedData.length)];
    let randomSecond =
      refinedData[Math.floor(Math.random() * refinedData.length)];

    const first = documents.find((user) => user.$id === randomFirst);
    const second = documents.find((user) => user.$id === randomSecond);

    insertThePage({ first, second });
    executeLeaderBoard(documents)
  } catch (error) {
    console.error("Error fetching IDs:", error.message);
  }
}

async function updateSupabaseRatings(id1, id1Score, id2, id2Score) {
  try {
    await databases.updateDocument(
      databaseID,
      collectionID,
      id1,
      { face_rating: id1Score },
      ["read('any')"]
    );
    await databases.updateDocument(
      databaseID,
      collectionID,
      id2,
      { face_rating: id2Score },
      ["read('any')"]
    );
    console.log("Scores successfully updated");
  } catch (error) {
    console.error("Error updating scores:", error.message);
  }
}

function insertThePage({ first, second }) {
  const truncateName = (name) => (name.length > 8 ? name.slice(0, 8) : name);

  const firstName = truncateName(first.name);
  const secondName = truncateName(second.name);

  document.querySelector("#app").innerHTML = `
    <div class="bg-gray-100 min-h-screen flex items-center justify-center">
      <div class="bg-white shadow-lg rounded-lg p-6 max-w-xl w-full text-center">
        <h1 class="text-2xl font-bold mb-6">Select your candidate</h1>
        <div class="flex justify-around items-center mb-6" style="gap:2rem">
          <div class="text-center">
            <img src="${first.profile_image}" id="faceA-img" class="circular-img">
            <p id="faceA-rating" class="mt-2 text-lg font-semibold">Score: ${first.face_rating}</p>
            <button id="selectA" class="minimal-button">${firstName}</button>
          </div>
          <p class="text-xl font-bold">VS</p>
          <div class="text-center">
           <img src="${second.profile_image}" id="faceB-img" class="circular-img">
            <p id="faceB-rating" class="mt-2 text-lg font-semibold">Score: ${second.face_rating}</p>
            <button id="selectB" class="minimal-button">${secondName}</button>
          </div>
        </div>
        <button id="matchBtn" class="minimal-button">DRAW</button>
        <p id="result" class="mt-6 text-xl font-semibold"></p>
      </div>
    </div>
  `;

  const currentRatingA = first.face_rating;
  const currentRatingB = second.face_rating;

  const expectedScoreA = calculateExpectedScore(currentRatingA, currentRatingB);
  const expectedScoreB = calculateExpectedScore(currentRatingB, currentRatingA);

  document.querySelector("#selectA").addEventListener("click", async () => {
    const score = { a: 1, b: 0 };
    const updatedRatingA = updateRating(
      currentRatingA,
      expectedScoreA,
      score.a
    );
    const updatedRatingB = updateRating(
      currentRatingB,
      expectedScoreB,
      score.b
    );
    await updateSupabaseRatings(
      first.$id,
      updatedRatingA,
      second.$id,
      updatedRatingB
    );
    window.location.reload();
  });

  document.querySelector("#selectB").addEventListener("click", async () => {
    const score = { a: 0, b: 1 };
    const updatedRatingA = updateRating(
      currentRatingA,
      expectedScoreA,
      score.a
    );
    const updatedRatingB = updateRating(
      currentRatingB,
      expectedScoreB,
      score.b
    );
    await updateSupabaseRatings(
      second.id,
      updatedRatingB,
      first.id,
      updatedRatingA
    );
    window.location.reload();
  });

  document.querySelector("#matchBtn").addEventListener("click", async () => {
    const score = { a: 0.5, b: 0.5 };
    const updatedRatingA = updateRating(
      currentRatingA,
      expectedScoreA,
      score.a
    );
    const updatedRatingB = updateRating(
      currentRatingB,
      expectedScoreB,
      score.b
    );
    await updateSupabaseRatings(
      second.id,
      updatedRatingB,
      first.id,
      updatedRatingA
    );
    window.location.reload();
  });
}

main();
