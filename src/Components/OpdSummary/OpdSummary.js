
const OpdSummary = () => {
    return (
        <section class="opdGrid- stats-grid">
            <article class="stat-card">
                <div class="stat-top">
                    <span class="stat-label">Total Patients</span>
                    <span class="stat-icon blue">
                        <img src="images/icons/users-icon.svg" alt="users" />
                    </span>
                </div>
                <div class="stat-bottom">
                    <h2>12</h2>
                    <span class="stat-note">Registered Today</span>
                </div>
            </article>

            <article class="stat-card">
                <div class="stat-top">
                    <span class="stat-label">Waiting Patients</span>
                    <span class="stat-icon amber">
                        <img src="images/icons/watch-icon.svg" alt="watch icon" />
                    </span>
                </div>
                <div class="stat-bottom">
                    <h2>4</h2>
                    <span class="stat-note">Awaiting Consultation</span>
                </div>
            </article>

            <article class="stat-card">
                <div class="stat-top">
                    <span class="stat-label">Completed</span>
                    <span class="stat-icon green">
                        <img src="images/icons/check-icon.svg" alt="check icon" />
                    </span>
                </div>
                <div class="stat-bottom">
                    <h2>7</h2>
                    <span class="stat-note">Consultations Finished</span>
                </div>
            </article>
        </section>
    )
}

export default OpdSummary;