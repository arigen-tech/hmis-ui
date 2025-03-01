import React, { useEffect, useState } from "react";

const AddDoctor = () => {

return(
    <>
      <div className="body d-flex py-3">
  <div className="container-xxl">
    <div className="row align-items-center">
      <div className="border-0 mb-4">
        <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
          <h3 className="fw-bold mb-0">Add Doctor</h3>
        </div>
      </div>
    </div>{" "}
    {/* Row end  */}
    <div className="row mb-3">
      <div className="col-sm-12">
        <div className="card shadow mb-3">
          <div className="card-header py-3 d-flex justify-content-between bg-light border-bottom-1">
            <h6 className="mb-0 fw-bold ">Doctor Basic Inforamtion</h6>
          </div>
          <div className="card-body">
            <form>
              <div className="row g-3 align-items-center">
                <div className="col-md-6">
                  <label htmlFor="firstname" className="form-label">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="firstname"
                    required=""
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="lastname" className="form-label">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="lastname"
                    required=""
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="phonenumber" className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="phonenumber"
                    required=""
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="emailaddress" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="emailaddress"
                    required=""
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="admitdate" className="form-label">
                    Join Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="admitdate"
                    required=""
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="admittime" className="form-label">
                    Join Time
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    id="admittime"
                    required=""
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="formFileMultiple" className="form-label">
                    {" "}
                    Document Upload
                  </label>
                  <input
                    className="form-control"
                    type="file"
                    id="formFileMultiple"
                    multiple=""
                    required=""
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Gender</label>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="exampleRadios"
                          id="exampleRadios11"
                          defaultValue="option1"
                          defaultChecked=""
                        />
                        <label
                          className="form-check-label"
                          htmlFor="exampleRadios11"
                        >
                          Male
                        </label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="exampleRadios"
                          id="exampleRadios22"
                          defaultValue="option2"
                        />
                        <label
                          className="form-check-label"
                          htmlFor="exampleRadios22"
                        >
                          Female
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-12">
                  <label htmlFor="addnote" className="form-label">
                    Add Note
                  </label>
                  <textarea
                    className="form-control"
                    id="addnote"
                    rows={3}
                    defaultValue={""}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-4">
                Submit
              </button>
            </form>
          </div>
        </div>
        <div className="card shadow mb-3">
          <div className="card-header py-3 d-flex justify-content-between bg-light border-bottom-1">
            <h6 className="mb-0 fw-bold ">Personal Information</h6>
          </div>
          <div className="card-body">
            <form>
              <div className="row g-3 align-items-center">
                <div className="col-md-6">
                  <label className="form-label">Doctor Payment Option</label>
                  <select
                    className="form-select"
                    aria-label="Default select example"
                  >
                    <option selected="">Payment Option</option>
                    <option value={1}>Credit Card</option>
                    <option value={2}>Debit Card</option>
                    <option value={3}>Case Money</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor="roominfo" className="form-label">
                    Cabin Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="roominfo"
                    required=""
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="speciality" className="form-label">
                    Speciality
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="speciality"
                    required=""
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Arigen-Health Virtual call Attend?
                  </label>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="exampleRadios"
                          id="exampleRadios111"
                          defaultValue="option1"
                          defaultChecked=""
                        />
                        <label
                          className="form-check-label"
                          htmlFor="exampleRadios111"
                        >
                          Yes
                        </label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="exampleRadios"
                          id="exampleRadios222"
                          defaultValue="option2"
                        />
                        <label
                          className="form-check-label"
                          htmlFor="exampleRadios222"
                        >
                          No
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-12">
                  <label htmlFor="speciality" className="form-label">
                    Social link
                  </label>
                  <div className="row g-3 row-cols-1 row-cols-lg-3">
                    <div className="col">
                      <input
                        type="text"
                        className="form-control"
                        id="speciality"
                        required=""
                        placeholder="Facebook Link"
                      />
                    </div>
                    <div className="col">
                      <input
                        type="text"
                        className="form-control"
                        id="speciality"
                        required=""
                        placeholder="Instagram Link"
                      />
                    </div>
                    <div className="col">
                      <input
                        type="text"
                        className="form-control"
                        id="speciality"
                        required=""
                        placeholder="linkedin Link"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-4">
                Submit
              </button>
            </form>
          </div>
        </div>
        <div className="card shadow mb-3">
          <div className="card-header py-3 d-flex justify-content-between bg-light border-bottom-1">
            <h6 className="mb-0 fw-bold ">Authentication Information</h6>
          </div>
          <div className="card-body">
            <form>
              <div className="row g-3 align-items-center">
                <div className="col-md-6">
                  <label htmlFor="user" className="form-label">
                    User Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="user"
                    required=""
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    required=""
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="cnpassword" className="form-label">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="cnpassword"
                    required=""
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Login Permission </label>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="exampleRadios"
                          id="exampleRadios07"
                          defaultValue="option1"
                          defaultChecked=""
                        />
                        <label
                          className="form-check-label"
                          htmlFor="exampleRadios07"
                        >
                          Hospital Only
                        </label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="exampleRadios"
                          id="exampleRadios08"
                          defaultValue="option2"
                        />
                        <label
                          className="form-check-label"
                          htmlFor="exampleRadios08"
                        >
                          Any where
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-4">
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
        </div>

    </>
);
};

export default AddDoctor;