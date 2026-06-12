export const mockCourses = [
  { course_code: "BSMA1001", course_name: "Mathematics I", level: "Foundation", capacity: 100, available_seats: 45, term: "Term 1" },
  { course_code: "BSMA1002", course_name: "Mathematics II", level: "Foundation", capacity: 100, available_seats: 65, term: "Term 2" },
  { course_code: "BSCS1001", course_name: "Introduction to Programming (Python)", level: "Foundation", capacity: 150, available_seats: 20, term: "Term 1" },
  { course_code: "BSCS1002", course_name: "Data Structures and Algorithms", level: "Foundation", capacity: 120, available_seats: 10, term: "Term 2" },
  { course_code: "BSCS2001", course_name: "Database Management Systems", level: "Diploma", capacity: 80, available_seats: 30, term: "Term 1" },
  { course_code: "BSCS2002", course_name: "Application Development (Web)", level: "Diploma", capacity: 90, available_seats: 15, term: "Term 2" },
  { course_code: "BSSE3001", course_name: "Software Engineering", level: "BSc", capacity: 60, available_seats: 25, term: "Term 1" },
  { course_code: "BSAI3002", course_name: "Artificial Intelligence & Machine Learning", level: "BSc", capacity: 60, available_seats: 5, term: "Term 2" }
];

export const mockStudents = [
  {
    roll_no: "23t1-stud-001",
    name: "John Doe",
    email: "student@example.com",
    interests: ["Programming", "AI", "Mathematics"],
    goals: ["Software Engineer", "Research"],
    schedule: "Morning",
    commitment: 15,
    cgpa: 8.5,
    current_level: "Foundation"
  },
  {
    roll_no: "23t1-stud-002",
    name: "Jane Smith",
    email: "janesmith@example.com",
    interests: ["Data Science", "Databases"],
    goals: ["Data Analyst"],
    schedule: "Evening",
    commitment: 10,
    cgpa: 7.9,
    current_level: "Diploma"
  }
];

export const mockEnrollments = [
  { id: "e1", roll_no: "23t1-stud-001", course_code: "BSCS1001", term: "Term 1", grade: "A", status: "completed" },
  { id: "e2", roll_no: "23t1-stud-001", course_code: "BSMA1001", term: "Term 1", grade: "B", status: "completed" },
  { id: "e3", roll_no: "23t1-stud-002", course_code: "BSCS1001", term: "Term 1", grade: "A", status: "completed" }
];

export const mockFeedback = [
  {
    id: "f1",
    course_code: "BSCS1001",
    roll_no: "23t1-stud-001",
    rating: 5,
    title: "Excellent Intro!",
    description: "Highly recommended for beginners. The course covers concepts step-by-step with practical assignments.",
    created_at: new Date().toISOString()
  },
  {
    id: "f2",
    course_code: "BSMA1001",
    roll_no: "23t1-stud-001",
    rating: 4,
    title: "Rigorous but fun",
    description: "Maths course was challenging but very relevant for logic building.",
    created_at: new Date().toISOString()
  }
];

export const mockRecommendations = [
  {
    id: "r1",
    roll_no: "23t1-stud-001",
    created_at: new Date().toISOString(),
    criteria: {
      interests: ["Programming", "AI"],
      goals: ["Software Engineer"],
      schedule: "Morning",
      commitment: 15
    },
    recommended_courses: [
      {
        course_code: "BSCS1002",
        course_name: "Data Structures and Algorithms",
        explanation: "As you have completed Introduction to Programming, DSA is the direct next step for Software Engineering."
      },
      {
        course_code: "BSMA1002",
        course_name: "Mathematics II",
        explanation: "Necessary foundation for Machine Learning and advanced algorithms."
      }
    ]
  }
];

export let mockSettings = {
  max_recommendation_limit: 5
};
