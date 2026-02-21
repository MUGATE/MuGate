export interface Course {
    id: string;
    courseCode: string;
    courseName: string;
    credits: number;
    department: string;
}

export interface CourseSection {
    sectionId: string;
    courseId: string;
    instructor: string;
    schedule: string;
    capacity: number;
    enrolled: number;
}
