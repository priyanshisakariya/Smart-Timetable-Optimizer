import { useState, useEffect } from "react";
import FacultyLayout from "../FacultyLayout";

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaGraduationCap,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";

import "./FacultyProfile.css";
import axios from "axios";

function FacultyProfile() {

  // ======================================================
  // EDIT MODE
  // ======================================================

  const [editMode, setEditMode] = useState(false);


  // ======================================================
  // FACULTY DATA
  // ======================================================

  const [faculty, setFaculty] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
  });


  // ======================================================
  // LOADING
  // ======================================================

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);


  // ======================================================
  // FACULTY ID
  // ======================================================

  const [facultyId, setFacultyId] = useState(null);


  // ======================================================
  // GET LOGGED-IN FACULTY ID
  // ======================================================

  const getFacultyId = () => {

    // Try user object first

    const storedUser =
      localStorage.getItem("user");

    if (storedUser) {

      try {

        const user =
          JSON.parse(storedUser);

        if (
          user &&
          user.id
        ) {
          return user.id;
        }

        if (
          user &&
          user._id
        ) {
          return user._id;
        }

      } catch (error) {

        console.error(
          "User JSON parse error:",
          error
        );

      }
    }


    // Try direct facultyId

    const storedFacultyId =
      localStorage.getItem(
        "facultyId"
      );

    if (storedFacultyId) {
      return storedFacultyId;
    }


    // Try userId

    const storedUserId =
      localStorage.getItem(
        "userId"
      );

    if (storedUserId) {
      return storedUserId;
    }


    return null;
  };


  // ======================================================
  // GET FACULTY PROFILE
  // ======================================================

  useEffect(() => {

    const fetchFacultyProfile =
      async () => {

        try {

          const id =
            getFacultyId();


          console.log(
            "Logged-in Faculty ID:",
            id
          );


          if (!id) {

            alert(
              "Faculty ID not found. Please login again."
            );

            setLoading(false);

            return;
          }


          setFacultyId(id);


          const response =
            await axios.get(

              `http://localhost:5000/api/auth/faculty-profile?id=${id}`

            );


          console.log(
            "Faculty Profile Response:",
            response.data
          );


          const facultyData =
            response.data.faculty;


          if (!facultyData) {

            alert(
              "Faculty profile not found"
            );

            return;
          }


          setFaculty({

            name:
              facultyData.name || "",

            email:
              facultyData.email || "",

            phone:
              facultyData.phone || "",

            department:
              facultyData.department || ""

          });

        } catch (error) {

          console.error(
            "Fetch Faculty Profile Error:",
            error
          );


          if (error.response) {

            alert(
              error.response.data.message ||
              "Failed to load faculty profile"
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


    fetchFacultyProfile();

  }, []);


  // ======================================================
  // HANDLE INPUT CHANGE
  // ======================================================

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target;


    setFaculty({

      ...faculty,

      [name]:
        value

    });

  };


  // ======================================================
  // SAVE PROFILE
  // ======================================================

  const handleSave =
    async () => {

      if (!facultyId) {

        alert(
          "Faculty ID not found"
        );

        return;
      }


      if (
        !faculty.name ||
        !faculty.email ||
        !faculty.phone ||
        !faculty.department
      ) {

        alert(
          "Please fill all fields"
        );

        return;
      }


      setSaving(true);


      try {

        const response =
          await axios.put(

            `http://localhost:5000/api/auth/faculty-profile/${facultyId}`,

            {

              name:
                faculty.name,

              email:
                faculty.email,

              phone:
                faculty.phone,

              department:
                faculty.department

            }

          );


        console.log(
          "Update Faculty Profile Response:",
          response.data
        );


        const updatedFaculty =
          response.data.faculty;


        setFaculty({

          name:
            updatedFaculty.name || "",

          email:
            updatedFaculty.email || "",

          phone:
            updatedFaculty.phone || "",

          department:
            updatedFaculty.department || ""

        });


        // Update stored user also

        const storedUser =
          localStorage.getItem(
            "user"
          );


        if (storedUser) {

          try {

            const user =
              JSON.parse(
                storedUser
              );


            user.name =
              updatedFaculty.name;

            user.email =
              updatedFaculty.email;


            localStorage.setItem(
              "user",
              JSON.stringify(user)
            );

          } catch (error) {

            console.error(
              "Local user update error:",
              error
            );

          }

        }


        setEditMode(false);


        alert(
          "Profile updated successfully!"
        );

      } catch (error) {

        console.error(
          "Update Faculty Profile Error:",
          error
        );


        if (error.response) {

          alert(
            error.response.data.message ||
            "Failed to update profile"
          );

        } else {

          alert(
            "Cannot connect to server"
          );

        }

      } finally {

        setSaving(false);

      }

    };


  // ======================================================
  // CANCEL EDIT
  // ======================================================

  const handleCancel = () => {

    setEditMode(false);

  };


  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {

    return (

      <FacultyLayout>

        <div className="faculty-profile">

          <p>
            Loading profile...
          </p>

        </div>

      </FacultyLayout>

    );

  }


  // ======================================================
  // UI
  // ======================================================

  return (

    <FacultyLayout>

      <div className="faculty-profile">


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="profile-header">

          <div>

            <h1>
              My Profile
            </h1>

            <p>
              View and manage your faculty information.
            </p>

          </div>


          <div className="profile-icon">

            <FaUser />

          </div>

        </div>


        {/* ==================================================
            PROFILE CARD
        ================================================== */}

        <div className="profile-card">


          {/* PROFILE TOP */}

          <div className="profile-top">

            <div className="profile-avatar">

              <FaUser />

            </div>


            <div className="profile-name">

              <h2>
                {faculty.name}
              </h2>

              <p>
                {faculty.department}
                {" "}
                Department
              </p>

            </div>


            {!editMode ? (

              <button
                className="edit-profile-button"
                type="button"
                onClick={() =>
                  setEditMode(true)
                }
              >

                <FaEdit />

                Edit Profile

              </button>

            ) : (

              <div className="profile-actions">

                <button
                  className="save-profile-button"
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                >

                  <FaSave />

                  {saving
                    ? "Saving..."
                    : "Save"
                  }

                </button>


                <button
                  className="cancel-profile-button"
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                >

                  <FaTimes />

                  Cancel

                </button>

              </div>

            )}

          </div>


          {/* ==================================================
              PERSONAL INFORMATION
          ================================================== */}

          <div className="profile-information">

            <h2>
              Personal Information
            </h2>


            {!editMode ? (

              <div className="profile-grid">


                {/* NAME */}

                <div className="profile-field">

                  <div className="field-icon">

                    <FaUser />

                  </div>

                  <div>

                    <span>
                      Full Name
                    </span>

                    <p>
                      {faculty.name}
                    </p>

                  </div>

                </div>


                {/* EMAIL */}

                <div className="profile-field">

                  <div className="field-icon">

                    <FaEnvelope />

                  </div>

                  <div>

                    <span>
                      Email Address
                    </span>

                    <p>
                      {faculty.email}
                    </p>

                  </div>

                </div>


                {/* PHONE */}

                <div className="profile-field">

                  <div className="field-icon">

                    <FaPhone />

                  </div>

                  <div>

                    <span>
                      Phone Number
                    </span>

                    <p>
                      {faculty.phone}
                    </p>

                  </div>

                </div>


                {/* DEPARTMENT */}

                <div className="profile-field">

                  <div className="field-icon">

                    <FaGraduationCap />

                  </div>

                  <div>

                    <span>
                      Department
                    </span>

                    <p>
                      {faculty.department}
                    </p>

                  </div>

                </div>

              </div>

            ) : (

              <div className="profile-edit-grid">


                {/* NAME */}

                <div className="edit-field">

                  <label>
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={faculty.name}
                    onChange={handleChange}
                  />

                </div>


                {/* EMAIL */}

                <div className="edit-field">

                  <label>
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={faculty.email}
                    onChange={handleChange}
                  />

                </div>


                {/* PHONE */}

                <div className="edit-field">

                  <label>
                    Phone Number
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={faculty.phone}
                    onChange={handleChange}
                  />

                </div>


                {/* DEPARTMENT */}

                <div className="edit-field">

                  <label>
                    Department
                  </label>

                  <input
                    type="text"
                    name="department"
                    value={faculty.department}
                    onChange={handleChange}
                  />

                </div>

              </div>

            )}

          </div>

        </div>

      </div>

    </FacultyLayout>

  );

}

export default FacultyProfile;