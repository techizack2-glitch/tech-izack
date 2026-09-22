// ================= MOBILE MENU =================

function toggleMenu() {
    const nav = document.getElementById("mainNav");
    nav.classList.toggle("open");
}


// ================= MODALS =================

function openModal(id) {
    document.getElementById(id).classList.add("show");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("show");
}

function switchModal(closeId, openId) {
    closeModal(closeId);
    openModal(openId);
}


// Close modal when clicking outside

document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", function(event) {

        if (event.target === modal) {
            modal.classList.remove("show");
        }

    });

});


// ================= SIGN UP DEMO =================

async function signup(event) {

    event.preventDefault();

    const name =
        document.getElementById("signupName").value.trim();

    const email =
        document.getElementById("signupEmail").value.trim();

    const password =
        document.getElementById("signupPassword").value;

    if (password.length < 8) {
        alert("Password must contain at least 8 characters.");
        return;
    }

    const { data, error } =
        await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name
                }
            }
        });

    if (error) {
        alert(error.message);
        return;
    }

    if (data.user) {

        await supabaseClient
            .from("profiles")
            .insert({
                id: data.user.id,
                full_name: name
            });
    }

    alert(
        "Account created successfully! Check your email if email confirmation is enabled."
    );

    closeModal("signupModal");

    document.querySelector("#signupModal form").reset();
}


// ================= LOGIN DEMO =================

async function login(event) {

    event.preventDefault();

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {
        alert(error.message);
        return;
    }

    if (data.user) {

        window.location.href = "dashboard.html";

    }
}


// ================= CONTACT FORM =================

function sendMessage(event) {

    event.preventDefault();

    alert(
        "Message captured successfully.\n\nConnect this form to your email service or backend to receive real messages."
    );

    event.target.reset();
}


// ================= COURSE BUTTONS =================

document.querySelectorAll(".course-btn").forEach(button => {

    button.addEventListener("click", function() {

        alert(
            "Course system coming next.\n\nThis button can open lessons, quizzes, labs and progress tracking."
        );

    });

});


// ================= LEVEL TABS =================

document.querySelectorAll(".level-tabs button").forEach(button => {

    button.addEventListener("click", function() {

        document
            .querySelectorAll(".level-tabs button")
            .forEach(btn => btn.classList.remove("active"));

        this.classList.add("active");

    });

});


// ================= CLOSE MOBILE MENU =================

document.querySelectorAll("nav a").forEach(link => {

    link.addEventListener("click", function() {

        document
            .getElementById("mainNav")
            .classList.remove("open");

    });

});
function openCourse(id) {
    window.location.href =
        `courses/course.html?id=${id}`;
}
let labs = [];
async function loadLabs() {

    const {
        data,
        error
    } = await supabaseClient
        .from("labs")
        .select("*")
        .eq("course_id", courseId)
        .order("id");


    if (error) {

        console.error(error);

        return;
    }


    labs = data || [];

    renderLabs();

}
function renderLabs() {

    const area =
        document.getElementById(
            "quizArea"
        );


    if (!labs.length) return;


    const html = `

        <div class="quiz-box">

            <span class="section-tag">
                // PRACTICAL LABS
            </span>

            <h2>
                Practice
            </h2>

            ${labs.map(lab => `

                <div class="student-course"
                     style="margin-top:15px">

                    <h3>
                        ${escapeHTML(lab.title)}
                    </h3>

                    <p>
                        ${escapeHTML(
                            lab.description || ""
                        )}
                    </p>

                    <a
                        class="btn btn-primary"
                        href="lab.html?id=${lab.id}">

                        Start Lab

                    </a>

                </div>

            `).join("")}

        </div>

    `;


    area.insertAdjacentHTML(
        "beforeend",
        html
    );

}
await loadLabs();
if (percentage >= 70) {
    if (percentage >= 70) {

    await supabaseClient
        .from("enrollments")
        .update({
            progress: 100
        })
        .eq("user_id", currentUser.id)
        .eq("course_id", courseId);


    const certificate =
        await createCertificate();


    result.innerHTML += `

        <p class="success">
            🎉 Congratulations!
            You completed the course.
        </p>

        <a
            class="btn btn-primary"
            href="certificate.html?id=${certificate.certificate_id}">

            View Certificate

        </a>

    `;

}
async function createCertificate() {

    const {
        data: profile
    } = await supabaseClient
        .from("profiles")
        .select("full_name")
        .eq("id", currentUser.id)
        .single();


    const {
        data: course
    } = await supabaseClient
        .from("courses")
        .select("title")
        .eq("id", courseId)
        .single();


    const certificateId =
        "TI-" +
        Date.now().toString(36).toUpperCase() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 7)
            .toUpperCase();


    const {
        data,
        error
    } = await supabaseClient
        .from("certificates")
        .upsert({

            certificate_id:
                certificateId,

            user_id:
                currentUser.id,

            course_id:
                Number(courseId),

            student_name:
                profile?.full_name ||
                currentUser.email,

            course_title:
                course.title

        }, {

            onConflict:
                "user_id,course_id"

        })
        .select()
        .single();


    if (error) {

        console.error(error);

        throw error;

    }


    return data;

}
container.innerHTML = courses.map(course => `

<div class="course-card">

    <span class="section-tag">
        ${escapeHTML(course.level)}
    </span>

    <h3>
        ${escapeHTML(course.title)}
    </h3>

    <p>
        ${escapeHTML(course.description)}
    </p>

    <div style="
        color:var(--muted);
        margin:15px 0;
    ">

        ${course.lessons} Lessons
        ·
        ${course.labs} Labs

    </div>

    <a
        href="course-player.html?id=${course.id}"
        class="btn btn-primary">

        Start Learning →

    </a>

</div>

`).join("");
async function checkCourseCompletion() {

    const allLessonsComplete =
        lessons.length > 0 &&
        lessons.every(
            lesson =>
                isLessonComplete(lesson.id)
        );


    if (!allLessonsComplete) {
        return false;
    }


    const {
        data:quizList
    } =
    await supabaseClient
    .from("quizzes")
    .select("id")
    .eq(
        "course_id",
        courseId
    );


    if (!quizList || quizList.length === 0) {

        return true;

    }


    const quizIds =
        quizList.map(
            quiz => quiz.id
        );


    const {
        data:attempts
    } =
    await supabaseClient
    .from("quiz_attempts")
    .select("quiz_id,passed")
    .eq(
        "user_id",
        currentUser.id
    )
    .in(
        "quiz_id",
        quizIds
    );


    return quizIds.every(
        quizId =>
            attempts?.some(
                attempt =>
                    attempt.quiz_id === quizId &&
                    attempt.passed === true
            )
    );

}
const eligible =
    await checkCourseCompletion();

if (eligible) {

    const certificate =
        await createCertificate();

    alert(
        "🎉 Course completed! Your certificate is ready."
    );

    location.href =
        `certificate.html?id=${certificate.certificate_id}`;

} else {

    alert(
        "Lessons completed. Pass all required quizzes to unlock your certificate."
    );

}
async function enrollCourse(courseId) {

    const {
        data:{user}
    } =
    await supabaseClient
        .auth
        .getUser();

    if (!user) {

        location.href =
        "login.html";

        return;

    }


    const {
        error
    } =
    await supabaseClient
        .from("course_enrollments")
        .insert({

            user_id:
            user.id,

            course_id:
            courseId

        });


    if (error) {

        if (
            error.code === "23505"
        ) {

            alert(
                "You are already enrolled."
            );

        } else {

            alert(
                error.message
            );

        }

        return;

    }


    alert(
        "✓ Successfully enrolled!"
    );


    location.href =
    `course.html?id=${courseId}`;

}
async function completeLesson(
    lessonId
) {

    const {
        data:{user}
    } =
    await supabaseClient
        .auth
        .getUser();


    if (!user) return;


    const {
        error
    } =
    await supabaseClient
        .from("lesson_progress")
        .upsert({

            user_id:
            user.id,

            lesson_id:
            lessonId,

            completed:true,

            completed_at:
            new Date().toISOString()

        });


    if (error) {

        document.getElementById(
            "lessonMessage"
        ).textContent =
        error.message;

        return;

    }


    document.getElementById(
        "lessonMessage"
    ).textContent =
    "✓ Lesson completed!";


    document.getElementById(
        "completeLessonBtn"
    ).disabled =
    true;

}
document
.getElementById(
    "completeLessonBtn"
)
.addEventListener(
    "click",
    () => completeLesson(
        lessonId
    )
);
async function completeLesson(lessonId) {

    const { error } =
        await supabaseClient
        .from("lesson_progress")
        .upsert({

            user_id: user.id,

            lesson_id: lessonId,

            completed: true,

            completed_at:
                new Date().toISOString()

        });

    if (error) {
        alert(error.message);
        return;
    }

    alert("✓ Lesson completed!");

    location.href =
        "student-dashboard.html";
}
async function requireStudent() {

    const {
        data: {
            user
        }
    } =
    await supabaseClient.auth
        .getUser();


    if (!user) {

        location.href =
            "login.html";

        return null;

    }


    const {
        data: profile
    } =
    await supabaseClient

        .from("profiles")

        .select("*")

        .eq(
            "id",
            user.id
        )

        .single();


    if (!profile) {

        location.href =
            "login.html";

        return null;

    }


    if (
        profile.role !==
        "student"
    ) {

        location.href =
            "admin.html";

        return null;

    }


    return {
        user,
        profile
    };

}


requireStudent();
async function checkAdmin() {

    const {
        data: {
            user
        }
    } =
    await supabaseClient.auth
        .getUser();


    if (!user) {

        location.href =
            "login.html";

        return;

    }


    const {
        data: profile,
        error
    } =
    await supabaseClient

        .from("profiles")

        .select("role, full_name")

        .eq(
            "id",
            user.id
        )

        .single();


    if (
        error ||
        !profile
    ) {

        await supabaseClient.auth
            .signOut();

        location.href =
            "login.html";

        return;

    }


    if (
        profile.role !==
        "admin"
    ) {

        location.href =
            "student-dashboard.html";

        return;

    }


    loadDashboard();

}
async function loadCourseProgress() {

    const {
        data: lessons,
        error
    } =
    await supabaseClient

        .from("lessons")

        .select("id")

        .eq(
            "course_name",
            "Kali Linux"
        )

        .eq(
            "published",
            true
        );


    if (error) {

        console.error(error);

        return;

    }


    const {
        data: completed
    } =
    await supabaseClient

        .from("lesson_progress")

        .select("lesson_id")

        .eq(
            "user_id",
            user.id
        )

        .eq(
            "completed",
            true
        );


    const total =
        lessons.length;


    const done =
        completed.filter(
            item =>
                lessons.some(
                    lesson =>
                        lesson.id ===
                        item.lesson_id
                )
        ).length;


    const percent =
        total === 0
        ? 0
        : Math.round(
            (done / total) * 100
        );


    document.getElementById(
        "courseProgress"
    ).style.width =
        percent + "%";


    document.getElementById(
        "progressText"
    ).textContent =

        `${done} of ${total} lessons completed — ${percent}%`;

}
const toolId =
new URLSearchParams(
    location.search
).get("id");

document.getElementById(
    "startQuiz"
).href =
    `quiz.html?tool_id=${toolId}`;
    function generateCertificateId(courseSlug) {

    const random =
        crypto.randomUUID()
        .replaceAll("-", "")
        .substring(0, 8)
        .toUpperCase();

    return `TZA-${courseSlug
        .substring(0, 4)
        .toUpperCase()}-${random}`;

}
const {
    data,
    error
} =
await supabaseClient.rpc(
    "admin_stats"
);

if (!error) {

    document.getElementById(
        "courseCount"
    ).textContent =
        data.courses;

    document.getElementById(
        "lessonCount"
    ).textContent =
        data.lessons;

    document.getElementById(
        "labCount"
    ).textContent =
        data.labs;

    document.getElementById(
        "studentCount"
    ).textContent =
        data.students;

}
async function loadCourses() {

    const {
        data,
        error
    } = await supabaseClient
        .from("courses")
        .select("*")
        .order("created_at", {
            ascending:false
        });

    const container =
        document.getElementById("courses");

    if (error) {

        container.textContent =
            error.message;

        return;
    }

    if (!data || !data.length) {

        container.innerHTML = `
            <p style="color:var(--muted)">
                No courses created yet.
            </p>
        `;

        return;
    }

    container.innerHTML = data.map(course => `

        <article class="course">

            <div>

                <h3>
                    ${escapeHTML(course.title)}
                </h3>

                <p>
                    ${escapeHTML(course.level)}
                    ·
                    ${escapeHTML(course.slug)}
                </p>

                <div class="course-actions">

                    <a
                    href="admin-lessons.html?course_id=${course.id}"
                    class="btn btn-primary">

                        Lessons

                    </a>

                    <button
                    class="btn btn-outline"
                    onclick="togglePublished(
                        ${course.id},
                        ${course.published}
                    )">

                        ${
                            course.published
                            ? "Unpublish"
                            : "Publish"
                        }

                    </button>

                    <button
                    class="btn btn-danger"
                    onclick="deleteCourse(
                        ${course.id}
                    )">

                        Delete

                    </button>

                </div>

            </div>

            <span class="badge">

                ${
                    course.published
                    ? "Published"
                    : "Draft"
                }

            </span>

        </article>

    `).join("");
}
async function togglePublished(
    courseId,
    currentStatus
) {

    const {
        error
    } = await supabaseClient
        .from("courses")
        .update({
            published: !currentStatus
        })
        .eq("id", courseId);

    if (error) {

        alert(error.message);

        return;
    }

    await loadCourses();
}
async function deleteCourse(
    courseId
) {

    const confirmed =
        confirm(
            "Delete this course? Lessons and labs linked to it may also be deleted."
        );

    if (!confirmed) {
        return;
    }

    const {
        error
    } = await supabaseClient
        .from("courses")
        .delete()
        .eq("id", courseId);

    if (error) {

        alert(error.message);

        return;
    }

    await loadStats();
    await loadCourses();
}
