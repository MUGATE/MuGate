export interface ScraperCredentials {
    username: string;
    password: string;
}

export interface ScrapedCourse {
    courseCode: string;
    courseName: string;
    section: string;
    instructor: string;
    schedule: string;
    credits: number;
}
