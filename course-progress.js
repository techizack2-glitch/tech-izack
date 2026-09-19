```javascript
const SUPABASE_URL =
    "WEKA_PROJECT_URL_HAPA";

const SUPABASE_KEY =
    "WEKA_PUBLISHABLE_KEY_HAPA";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/*
================================
GET CURRENT USER
================================
*/

async function getCurrentUser() {

    const {
        data,
        error
    } =
    await supabaseClient.auth
        .getUser();


    if (
        error ||
        !data.user
    ) {

        location.href =
            "login.html";

        return null;

    }


    return data.user;

}


/*
================================
GET COURSE PROGRESS
================================
*/

async function getCourseProgress(
    courseId
) {

    const user =
        await getCurrentUser();


    if (!user) {

        return null;

    }


    /*
    Get lessons.
    */

    const {
        data: lessons,
        error: lessonError
    } =
    await supabaseClient

        .from("lessons")

        .select(
            "id,title,lesson_order"
        )

        .eq(
            "course_id",
            courseId
        )

        .eq(
            "published",
            true
        )

        .order(
            "lesson_order",
            {
                ascending: true
            }
        );


    if (lessonError) {

        console.error(
            lessonError
        );

        return null;

    }


    /*
    Get completed lessons.
    */

    const lessonIds =
        (lessons || [])
            .map(
                lesson =>
                    lesson.id
            );


    let completedLessons = [];


    if (lessonIds.length) {

        const {
            data
        } =
        await supabaseClient

            .from("lesson_progress")

            .select(
                "lesson_id"
            )

            .eq(
                "user_id",
                user.id
            )

            .eq(
                "completed",
                true
            )

            .in(
                "lesson_id",
                lessonIds
            );


        completedLessons =
            data || [];

    }


    /*
    Get labs.
    */

    const {
        data: labs,
        error: labError
    } =
    await supabaseClient

        .from("labs")

        .select(
            "id,title,lab_order"
        )

        .eq(
            "course_id",
            courseId
        )

        .eq(
            "published",
            true
        )

        .order(
            "lab_order",
            {
                ascending: true
            }
        );


    if (labError) {

        console.error(
            labError
        );

        return null;

    }


    /*
    Get completed labs.
    */

    const labIds =
        (labs || [])
            .map(
                lab =>
                    lab.id
            );


    let completedLabs = [];


    if (labIds.length) {

        const {
            data
        } =
        await supabaseClient

            .from("lab_submissions")

            .select(
                "lab_id"
            )

            .eq(
                "user_id",
                user.id
            )

            .eq(
                "correct",
                true
            )

            .in(
                "lab_id",
                labIds
            );


        /*
        Remove duplicate submissions.
        */

        completedLabs =
            [
                ...new Map(
                    (data || [])
                        .map(
                            item => [
                                item.lab_id,
                                item
                            ]
                        )
                ).values()
            ];

    }


    /*
    Get quizzes.
    */

    const {
        data: quizzes,
        error: quizError
    } =
    await supabaseClient

        .from("quizzes")

        .select(
            "id,title,pass_percentage"
        )

        .eq(
            "course_id",
            courseId
        )

        .eq(
            "published",
            true
        );


    if (quizError) {

        console.error(
            quizError
        );

        return null;

    }


    /*
    Get quiz attempts.
    */

    const quizIds =
        (quizzes || [])
            .map(
                quiz =>
                    quiz.id
            );


    let quizAttempts = [];


    if (quizIds.length) {

        const {
            data
        } =
        await supabaseClient

            .from("quiz_attempts")

            .select(
                "quiz_id,percentage,passed,completed_at"
            )

            .eq(
                "user_id",
                user.id
            )

            .in(
                "quiz_id",
                quizIds
            )

            .order(
                "percentage",
                {
                    ascending: false
                }
            );


        quizAttempts =
            data || [];

    }


    /*
    LESSON PERCENTAGE
    */

    const lessonPercentage =
        lessons.length

            ? Math.round(
                completedLessons.length /
                lessons.length *
                100
            )

            : 0;


    /*
    LAB PERCENTAGE
    */

    const labPercentage =
        labs.length

            ? Math.round(
                completedLabs.length /
                labs.length *
                100
            )

            : 0;


    /*
    QUIZ PERCENTAGE
    */

    let quizPercentage = 0;


    if (quizAttempts.length) {

        quizPercentage =
            Math.max(
                ...quizAttempts.map(
                    attempt =>
                        attempt.percentage
                )
            );

    }


    /*
    OVERALL
    */

    const overall =
        Math.round(

            lessonPercentage * 0.40 +

            labPercentage * 0.30 +

            quizPercentage * 0.30

        );


    /*
    CONTINUE LEARNING
    */

    let continueUrl =
        null;


    /*
    First incomplete lesson.
    */

    const completedLessonSet =
        new Set(
            completedLessons.map(
                item =>
                    item.lesson_id
            )
        );


    const nextLesson =
        lessons.find(
            lesson =>
                !completedLessonSet.has(
                    lesson.id
                )
        );


    if (nextLesson) {

        continueUrl =
            `lesson.html?id=${nextLesson.id}`;

    }


    /*
    Otherwise first incomplete lab.
    */

    if (!continueUrl) {

        const completedLabSet =
            new Set(
                completedLabs.map(
                    item =>
                        item.lab_id
                )
            );


        const nextLab =
            labs.find(
                lab =>
                    !completedLabSet.has(
                        lab.id
                    )
            );


        if (nextLab) {

            continueUrl =
                `lab.html?id=${nextLab.id}`;

        }

    }


    /*
    Otherwise quiz.
    */

    if (
        !continueUrl &&
        quizzes.length
    ) {

        const quiz =
            quizzes[0];


        continueUrl =
            `quiz.html?id=${quiz.id}`;

    }


    return {

        lessons,

        labs,

        quizzes,

        completedLessons,

        completedLabs,

        quizAttempts,

        lessonPercentage,

        labPercentage,

        quizPercentage,

        overall,

        continueUrl

    };

}


/*
================================
RENDER COURSE PROGRESS
================================
*/

async function renderCourseProgress(
    courseId,
    containerId
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {

        return;

    }


    container.innerHTML = `
        <p>Loading progress...</p>
    `;


    const progress =
        await getCourseProgress(
            courseId
        );


    if (!progress) {

        container.innerHTML = `
            <p>
                Unable to load progress.
            </p>
        `;

        return;

    }


    container.innerHTML = `

        <div class="course-progress-card">

            <div class="progress-header">

                <div>

                    <span class="section-tag">
                        // COURSE PROGRESS
                    </span>

                    <h3>
                        Your Learning Progress
                    </h3>

                </div>

                <strong>
                    ${progress.overall}%
                </strong>

            </div>


            <div class="main-progress">

                <div
                class="main-progress-fill"
                style="
                    width:${progress.overall}%
                ">

                </div>

            </div>


            <div class="progress-items">


                <div class="progress-item">

                    <div>

                        <span>
                            📚 Lessons
                        </span>

                        <strong>
                            ${progress.lessonPercentage}%
                        </strong>

                    </div>

                    <div class="mini-bar">

                        <div
                        style="
                            width:${progress.lessonPercentage}%
                        ">

                        </div>

                    </div>

                </div>


                <div class="progress-item">

                    <div>

                        <span>
                            🧪 Labs
                        </span>

                        <strong>
                            ${progress.labPercentage}%
                        </strong>

                    </div>

                    <div class="mini-bar">

                        <div
                        style="
                            width:${progress.labPercentage}%
                        ">

                        </div>

                    </div>

                </div>


                <div class="progress-item">

                    <div>

                        <span>
                            🧠 Quiz
                        </span>

                        <strong>
                            ${progress.quizPercentage}%
                        </strong>

                    </div>

                    <div class="mini-bar">

                        <div
                        style="
                            width:${progress.quizPercentage}%
                        ">

                        </div>

                    </div>

                </div>

            </div>


            ${
                progress.continueUrl

                ? `

                    <a
                    href="${progress.continueUrl}"
                    class="btn btn-primary continue-btn">

                        Continue Learning →

                    </a>

                `

                : `

                    <div class="completed-message">

                        🎓 Course completed!

                    </div>

                `
            }

        </div>

    `;

}
```
.select("lab_id") .eq("user_id", user.id) .eq("correct", true)