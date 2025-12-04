// stories.js - initial data (can be edited via admin)
const stories = JSON.parse(localStorage.getItem('stories_backup') || JSON.stringify([
  {
    id: 1,
    title: "Story One — The Ember Gate",
    description: "A short description of Story One.",
    tags: ["fantasy","adventure"],
    img: "img/story1.jpg",
    chapters: [
      {id: 1, title: "Chapter 1", content: "<p>Chapter 1 content...</p>"},
      {id: 2, title: "Chapter 2", content: "<p>Chapter 2 content...</p>"}
    ],
    views: 0,
    ratings: [], // numbers 1-5
    comments: []
  },
  {
    id: 2,
    title: "Story Two — Quiet Streets",
    description: "A short description of Story Two.",
    tags: ["slice-of-life"],
    img: "img/story2.jpg",
    chapters: [{id:1,title:"Chapter 1",content:"<p>Quiet opening...</p>"}],
    views: 0,
    ratings: [],
    comments: []
  }
]));

// Ensure localStorage copy exists
localStorage.setItem('stories', JSON.stringify(stories));
