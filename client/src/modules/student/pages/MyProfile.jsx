import { useState, useEffect } from "react";
import StudentLayout from "../StudentLayout";

import {
    FaUser,
    FaEnvelope,
    FaPhone,
    FaGraduationCap,
    FaIdCard,
    FaEdit,
    FaSave,
    FaTimes
} from "react-icons/fa";

import axios from "axios";

import "./MyProfile.css";


function MyProfile() {

    // ======================================================
    // EDIT MODE
    // ======================================================

    const [editMode, setEditMode] = useState(false);

    // ======================================================
    // LOADING
    // ======================================================

    const [loading, setLoading] = useState(true);

    // ======================================================
    // STUDENT DATA
    // ======================================================

    const [student, setStudent] = useState({
        name: "",
        email: "",
        mobileNo: "",
        enrollmentNo: "",
        department: "",
        semester: ""
    });


    // ======================================================
    // GET LOGGED-IN STUDENT ID
    // ======================================================

    useEffect(() => {

        const fetchStudentProfile = async () => {

            try {

                const storedUser =
                    localStorage.getItem("user");

                if (!storedUser) {

                    alert("Please login first.");

                    return;
                }

                const user =
                    JSON.parse(storedUser);

                console.log(
                    "Logged-in User:",
                    user
                );


                // ==================================================
                // GET PROFILE FROM BACKEND
                // ==================================================

                const response = await axios.get(
                    `http://localhost:5000/api/auth/student-profile/${user.id}`
                );


                console.log(
                    "Student Profile:",
                    response.data
                );


                const data =
                    response.data.student;


                setStudent({

                    name: data.name || "",

                    email: data.email || "",

                    mobileNo: data.mobileNo || "",

                    enrollmentNo:
                        data.enrollmentNo || "",

                    department:
                        data.department || "",

                    semester:
                        data.semester || ""

                });


            } catch (error) {

                console.error(
                    "Fetch Student Profile Error:",
                    error
                );

                if (error.response) {

                    alert(
                        error.response.data.message ||
                        "Failed to load profile"
                    );

                } else {

                    alert(
                        "Cannot connect to server"
                    );

                }

            } finally {

                setLoading(false);

            }

        };


        fetchStudentProfile();

    }, []);


    // ======================================================
    // HANDLE INPUT CHANGE
    // ======================================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;


        setStudent({

            ...student,

            [name]: value

        });

    };


    // ======================================================
    // SAVE PROFILE
    // ======================================================

    const handleSave = async () => {

        try {

            const storedUser =
                localStorage.getItem("user");


            if (!storedUser) {

                alert("Please login first.");

                return;

            }


            const user =
                JSON.parse(storedUser);


            const response = await axios.put(

                `http://localhost:5000/api/auth/student-profile/${user.id}`,

                {

                    name: student.name,

                    email: student.email,

                    mobileNo: student.mobileNo,

                    enrollmentNo:
                        student.enrollmentNo,

                    department:
                        student.department,

                    semester:
                        student.semester

                }

            );


            console.log(
                "Update Profile Response:",
                response.data
            );


            // Update local state
            const updatedStudent =
                response.data.student;


            setStudent({

                name:
                    updatedStudent.name || "",

                email:
                    updatedStudent.email || "",

                mobileNo:
                    updatedStudent.mobileNo || "",

                enrollmentNo:
                    updatedStudent.enrollmentNo || "",

                department:
                    updatedStudent.department || "",

                semester:
                    updatedStudent.semester || ""

            });


            setEditMode(false);


            alert(
                "Profile updated successfully!"
            );


        } catch (error) {

            console.error(
                "Update Student Profile Error:",
                error
            );


            if (error.response) {

                alert(
                    error.response.data.message ||
                    "Profile update failed"
                );

            } else {

                alert(
                    "Cannot connect to server"
                );

            }

        }

    };


    // ======================================================
    // CANCEL EDIT
    // ======================================================

    const handleCancel = () => {

        setEditMode(false);

        // Reload profile from database
        window.location.reload();

    };


    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {

        return (

            <StudentLayout>

                <div className="student-profile">

                    <h2>
                        Loading profile...
                    </h2>

                </div>

            </StudentLayout>

        );

    }


    // ======================================================
    // UI
    // ======================================================

    return (

        <StudentLayout>

            <div className="student-profile">

                {/* HEADER */}

                <div className="student-profile-header">

                    <div>

                        <h1>
                            My Profile
                        </h1>

                        <p>
                            View and manage your student information.
                        </p>

                    </div>


                    <div className="student-profile-icon">

                        <FaUser />

                    </div>

                </div>


                {/* PROFILE CARD */}

                <div className="student-profile-card">


                    {/* PROFILE TOP */}

                    <div className="student-profile-top">


                        <div className="student-avatar">

                            <FaUser />

                        </div>


                        <div className="student-profile-name">

                            <h2>
                                {student.name}
                            </h2>

                            <p>
                                {student.department}
                                {" Department"}
                            </p>

                        </div>


                        {!editMode ? (

                            <button
                                className="student-edit-button"
                                onClick={() =>
                                    setEditMode(true)
                                }
                            >

                                <FaEdit />

                                Edit Profile

                            </button>

                        ) : (

                            <div className="student-profile-actions">

                                <button
                                    className="student-save-button"
                                    onClick={handleSave}
                                >

                                    <FaSave />

                                    Save

                                </button>


                                <button
                                    className="student-cancel-button"
                                    onClick={handleCancel}
                                >

                                    <FaTimes />

                                    Cancel

                                </button>

                            </div>

                        )}

                    </div>


                    {/* INFORMATION */}

                    <div className="student-profile-information">

                        <h2>
                            Student Information
                        </h2>


                        {!editMode ? (

                            <div className="student-profile-grid">


                                {/* NAME */}

                                <div className="student-profile-field">

                                    <div className="student-field-icon">

                                        <FaUser />

                                    </div>

                                    <div>

                                        <span>
                                            Full Name
                                        </span>

                                        <p>
                                            {student.name}
                                        </p>

                                    </div>

                                </div>


                                {/* EMAIL */}

                                <div className="student-profile-field">

                                    <div className="student-field-icon">

                                        <FaEnvelope />

                                    </div>

                                    <div>

                                        <span>
                                            Email Address
                                        </span>

                                        <p>
                                            {student.email}
                                        </p>

                                    </div>

                                </div>


                                {/* PHONE */}

                                <div className="student-profile-field">

                                    <div className="student-field-icon">

                                        <FaPhone />

                                    </div>

                                    <div>

                                        <span>
                                            Phone Number
                                        </span>

                                        <p>
                                            {student.mobileNo}
                                        </p>

                                    </div>

                                </div>


                                {/* ENROLLMENT */}

                                <div className="student-profile-field">

                                    <div className="student-field-icon">

                                        <FaIdCard />

                                    </div>

                                    <div>

                                        <span>
                                            Enrollment Number
                                        </span>

                                        <p>
                                            {student.enrollmentNo}
                                        </p>

                                    </div>

                                </div>


                                {/* DEPARTMENT */}

                                <div className="student-profile-field">

                                    <div className="student-field-icon">

                                        <FaGraduationCap />

                                    </div>

                                    <div>

                                        <span>
                                            Department
                                        </span>

                                        <p>
                                            {student.department}
                                        </p>

                                    </div>

                                </div>


                                {/* SEMESTER */}

                                <div className="student-profile-field">

                                    <div className="student-field-icon">

                                        <FaGraduationCap />

                                    </div>

                                    <div>

                                        <span>
                                            Semester
                                        </span>

                                        <p>
                                            Semester {student.semester}
                                        </p>

                                    </div>

                                </div>


                            </div>

                        ) : (

                            <div className="student-edit-grid">


                                {/* NAME */}

                                <div className="student-edit-field">

                                    <label>
                                        Full Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={student.name}
                                        onChange={handleChange}
                                    />

                                </div>


                                {/* EMAIL */}

                                <div className="student-edit-field">

                                    <label>
                                        Email Address
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={student.email}
                                        onChange={handleChange}
                                    />

                                </div>


                                {/* PHONE */}

                                <div className="student-edit-field">

                                    <label>
                                        Phone Number
                                    </label>

                                    <input
                                        type="text"
                                        name="mobileNo"
                                        value={student.mobileNo}
                                        onChange={handleChange}
                                    />

                                </div>


                                {/* ENROLLMENT */}

                                <div className="student-edit-field">

                                    <label>
                                        Enrollment Number
                                    </label>

                                    <input
                                        type="text"
                                        name="enrollmentNo"
                                        value={student.enrollmentNo}
                                        onChange={handleChange}
                                    />

                                </div>


                                {/* DEPARTMENT */}

                                <div className="student-edit-field">

                                    <label>
                                        Department
                                    </label>

                                    <input
                                        type="text"
                                        name="department"
                                        value={student.department}
                                        onChange={handleChange}
                                    />

                                </div>


                                {/* SEMESTER */}

                                <div className="student-edit-field">

                                    <label>
                                        Semester
                                    </label>

                                    <input
                                        type="text"
                                        name="semester"
                                        value={student.semester}
                                        onChange={handleChange}
                                    />

                                </div>


                            </div>

                        )}

                    </div>

                </div>

            </div>

        </StudentLayout>

    );

}


export default MyProfile;

