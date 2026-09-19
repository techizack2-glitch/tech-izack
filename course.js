const SUPABASE_URL =
    "WEKA_PROJECT_URL_HAPA";

const SUPABASE_KEY =
    "WEKA_PUBLISHABLE_KEY_HAPA";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ===============================
// GET COURSE ID
// ===============================

const params =
    new URLSearchParams(window.location.search);

const courseId =
    params.get("id");


// ===============================
// GLOBAL DATA
// ===============================

let currentUser = null;
let lessons = [];
let quizzes = [];
let currentLesson = 0;


// ===============================
// INITIALIZE
// ===============================

async function initialize() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {

        window.location.href =
            "index.html";

        return;
    }

    currentUser = user;

    if (!courseId) {

        alert("Course not found.");

        window.location.href =
            "dashboard.html";

        return;
    }

    await loadCourse();

    await loadLessons();

    await loadQuizzes();

}


// ===============================
// LOAD COURSE
// ===============================

async function loadCourse() {

    const {
        data,
        error
    } = await supabaseClient
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();


    if (error) {

        console.error(error);

        return;
    }


    document
        .getElementById("courseTitle")
        .textContent = data.title;


    document
        .getElementById("courseDescription")
        .textContent =
        data.description || "";

}


// ===============================
// LOAD LESSONS
// ===============================

async function loadLessons() {

    const {
        data,
        error
    } = await supabaseClient
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("lesson_order");


    if (error) {

        console.error(error);

        return;
    }


    lessons = data || [];

    renderLessonList();


    if (lessons.length) {

        showLesson(0);

    }

}


// ===============================
// RENDER LESSONS
// ===============================

function renderLessonList() {

    const list =
        document.getElementById(
            "lessonList"
        );


    if (!lessons.length) {

        list.innerHTML =
            "<p>No lessons yet.</p>";

        return;
    }


    list.innerHTML =
        lessons.map((lesson, index) => `

            <button
                class="lesson-button"
                onclick="showLesson(${index})">

                <span>
                    ${String(index + 1).padStart(2, "0")}
                </span>

                ${escapeHTML(lesson.title)}

            </button>

        `).join("");

}


// ===============================
// SHOW LESSON
// ===============================

function showLesson(index) {

    currentLesson = index;

    const lesson =
        lessons[index];


    if (!lesson) return;


    document
        .querySelectorAll(".lesson-button")
        .forEach((button, i) => {

            button.classList.toggle(
                "active",
                i === index
            );

        });


    const area =
        document.getElementById(
            "lessonArea"
        );


    area.innerHTML = `

        <span class="section-tag">
            LESSON ${index + 1}
        </span>

        <h2>
            ${escapeHTML(lesson.title)}
        </h2>

        <div class="lesson-text">
            ${formatText(lesson.content)}
        </div>

        <button
            class="btn btn-primary"
            onclick="completeLesson(${index})">

            <i class="fas fa-check"></i>

            Mark Lesson Complete

        </button>

    `;


    document
        .getElementById("quizArea")
        .innerHTML = "";

}


// ===============================
// LOAD QUIZZES
// ===============================

async function loadQuizzes() {

    const {
        data,
        error
    } = await supabaseClient
        .from("quizzes")
        .select("*")
        .eq("course_id", courseId);


    if (error) {

        console.error(error);

        return;
    }


    quizzes = data || [];

}


// ===============================
// COMPLETE LESSON
// ===============================

async function completeLesson(index) {

    const completed =
        index + 1;

    const total =
        lessons.length;


    const progress =
        Math.round(
            (completed / total) * 100
        );


    const {
        error
    } = await supabaseClient
        .from("enrollments")
        .update({
            progress: progress
        })
        .eq("user_id", currentUser.id)
        .eq("course_id", courseId);


    if (error) {

        console.error(error);

        alert(
            "Could not update progress."
        );

        return;
    }


    alert(
        `Lesson completed! Progress: ${progress}%`
    );


    if (index < lessons.length - 1) {

        showLesson(index + 1);

    } else {

        showQuiz();

    }

}


// ===============================
// QUIZ
// ===============================

function showQuiz() {

    const area =
        document.getElementById(
            "quizArea"
        );


    if (!quizzes.length) {

        area.innerHTML = `

            <div class="quiz-box">

                <h2>
                    Course Complete 🎉
                </h2>

                <p>
                    You have completed all available lessons.
                </p>

            </div>

        `;

        return;
    }


    let quizHTML = `

        <div class="quiz-box">

            <span class="section-tag">
                // FINAL QUIZ
            </span>

            <h2>
                Test Your Knowledge
            </h2>

            <form id="quizForm">

    `;


    quizzes.forEach((quiz, index) => {

        quizHTML += `

            <div class="question">

                <h3>
                    ${index + 1}.
                    ${escapeHTML(quiz.question)}
                </h3>

                <label>
                    <input
                        type="radio"
                        name="q${index}"
                        value="A"
                        required>

                    ${escapeHTML(quiz.option_a)}

                </label>

                <label>
                    <input
                        type="radio"
                        name="q${index}"
                        value="B">

                    ${escapeHTML(quiz.option_b)}

                </label>

                <label>
                    <input
                        type="radio"
                        name="q${index}"
                        value="C">

                    ${escapeHTML(quiz.option_c)}

                </label>

                <label>
                    <input
                        type="radio"
                        name="q${index}"
                        value="D">

                    ${escapeHTML(quiz.option_d)}

                </label>

            </div>

        `;

    });


    quizHTML += `

                <button
                    class="btn btn-primary"
                    type="submit">

                    Submit Quiz

                </button>

            </form>

            <div id="quizResult"></div>

        </div>

    `;


    area.innerHTML = quizHTML;


    document
        .getElementById("quizForm")
        .addEventListener(
            "submit",
            submitQuiz
        );

}


// ===============================
// SUBMIT QUIZ
// ===============================

async function submitQuiz(event) {

    event.preventDefault();


    const form =
        new FormData(event.target);


    let score = 0;


    quizzes.forEach((quiz, index) => {

        const answer =
            form.get(`q${index}`);


        if (
            answer ===
            quiz.correct_answer
        ) {

            score++;

        }

    });


    const percentage =
        Math.round(
            (score / quizzes.length) * 100
        );


    const result =
        document.getElementById(
            "quizResult"
        );


    result.innerHTML = `

        <div class="quiz-result">

            <h3>
                Score: ${score}/${quizzes.length}
            </h3>

            <p>
                ${percentage}% correct
            </p>

        </div>

    `;


    if (percentage >= 70) {

        await supabaseClient
            .from("enrollments")
            .update({
                progress: 100
            })
            .eq("user_id", currentUser.id)
            .eq("course_id", courseId);


        result.innerHTML += `

            <p class="success">
                🎉 Congratulations! Course completed.
            </p>

        `;

    } else {

        result.innerHTML += `

            <p class="warning">
                Review the lessons and try again.
            </p>

        `;

    }

}


// ===============================
// LOGOUT
// ===============================

async function logout() {

    await supabaseClient.auth.signOut();

    window.location.href =
        "index.html";

}


// ===============================
// SECURITY HELPERS
// ===============================

function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function formatText(text) {

    return escapeHTML(text)
        .replace(/\n/g, "<br><br>");

}


// ===============================

initialize();
async function generateCertificate() {

    const courseId =
        new URLSearchParams(
            location.search
        ).get("id");


    const { data, error } =
        await supabaseClient.rpc(
            "generate_certificate",
            {
                p_course_id:
                    Number(courseId)
            }
        );


    if (error) {

        alert(error.message);

        return;

    }


    if (
        data &&
        data.certificate_id
    ) {

        location.href =
            `certificate.html?id=${data.certificate_id}`;

    }

}
async function submitFlag() {

    const input =
        document.getElementById(
            "flagInput"
        );

    const result =
        document.getElementById(
            "result"
        );

    const submittedFlag =
        input.value.trim();


    if (!submittedFlag) {

        result.className =
            "result wrong";

        result.textContent =
            "Enter a flag first.";

        return;

    }


    const {
        data: {
            session
        }
    } =
    await supabaseClient.auth
        .getSession();


    if (!session) {

        result.className =
            "result wrong";

        result.textContent =
            "Please login first.";

        return;

    }


    const response =
        await fetch(

            `${SUPABASE_URL}/functions/v1/submit-lab-flag`,

            {

                method:"POST",

                headers:{

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${session.access_token}`

                },

                body:JSON.stringify({

                    lab_id:
                        lab.id,

                    flag:
                        submittedFlag

                })

            }

        );


    const data =
        await response.json();


    if (!response.ok) {

        result.className =
            "result wrong";

        result.textContent =
            data.error ||
            "Something went wrong.";

        return;

    }


    if (data.correct) {

        result.className =
            "result correct";

        result.textContent =
            "✓ Correct flag! Lab completed.";

        input.disabled = true;

    } else {

        result.className =
            "result wrong";

        result.textContent =
            "✗ Incorrect flag. Try again.";

    }

}
renderCourseProgress(
    course.id,
    "course-progress-1"
);
const {
    data: access
} = await supabaseClient
    .from("course_access")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("active", true)
    .maybeSingle();

if (!access) {
    location.href =
        `payment.html?course=${courseId}`;
    return;
}