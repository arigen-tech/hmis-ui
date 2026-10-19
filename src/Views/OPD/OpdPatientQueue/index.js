const OpdPatientQueue = () => {
    return (
        <>
            <div className="content-wrapper">


                <div className="row">
                    <div className="col-12 grid-margin stretch-card">
                        <div className="card form-card">
                            <div className="card-header">
                                <h4 className="card-title p-2 mb-0">
                                    OPD Patient Queue
                                </h4>
                            </div>
                            <div className="card-body">

                                <table class="table table-bordered table-hover align-middle">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Time</th>
                                            <th>Status</th>
                                            <th>Patient Name</th>
                                            <th>Gender</th>
                                            <th>Mobile No.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>10:20 AM</td>
                                            <td><span className='status alert-primary'>In Consultation</span></td>
                                            <td>Amit Kumar</td>
                                            <td>Male</td>
                                            <td>9876543210</td>
                                        </tr>
                                        <tr>
                                            <td>10:30 AM</td>
                                            <td><span className='status alert-warning'>Waiting</span></td>
                                            <td>Neha Singh</td>
                                            <td>Female</td>
                                            <td>9876543211</td>
                                        </tr>
                                        <tr>
                                            <td>10:40 AM</td>
                                            <td><span className='status alert-warning'>Waiting</span></td>
                                            <td>Rajesh Gupta</td>
                                            <td>Male</td>
                                            <td>9876543212</td>
                                        </tr>
                                        <tr>
                                            <td>10:50 AM</td>
                                            <td><span className='status alert-warning'>Waiting</span></td>
                                            <td>Priya Verma</td>
                                            <td>Female</td>
                                            <td>9876543213</td>
                                        </tr>
                                        <tr>
                                            <td>11:00 AM</td>
                                            <td><span className='status alert-warning'>Waiting</span></td>
                                            <td>Rahul Sharma</td>
                                            <td>Male</td>
                                            <td>9876543214</td>
                                        </tr>
                                        
                                    </tbody>
                                </table>


                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default OpdPatientQueue;