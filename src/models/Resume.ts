export type Education = {
    startDate?: string;
    endDate: string;
    name: string;
};

export function isEducation(obj: any): obj is Education {
    return (
        typeof obj === 'object' &&
        (typeof obj.startDate === 'undefined' || typeof obj.startDate === 'string') &&
        typeof obj.endDate === 'string' &&
        typeof obj.name === 'string'
    );
}

export type Career = {
    startDate: string;
    endDate?: string;
    name: string;
    job: string;
    workStyle?: string;
};

export function isCareer(obj: any): obj is Career {
    return (
        typeof obj === 'object' &&
        typeof obj.startDate === 'string' &&
        (typeof obj.endDate === 'undefined' || typeof obj.endDate === 'string') &&
        typeof obj.name === 'string' &&
        typeof obj.job === 'string' &&
        (typeof obj.workStyle === 'undefined' || typeof obj.workStyle === 'string')
    );
}

export type License = {
    date: string;
    name: string;
    type: "license" | "certification";
};

export function isLicense(obj: any): obj is License {
    return (
        typeof obj === 'object' &&
        typeof obj.date === 'string' &&
        typeof obj.name === 'string' &&
        (obj.type === 'license' || obj.type === 'certification')
    );
}

export type ResumeDetails = {
    education: Education[];
    career: Career[];
    license: License[];
    subject: string;
    condition: string;
    hobby: string;
    reason: string;
    expectations: string;
};

export class Resume {
    fullnameKana: string;
    fullname: string;
    sex: string;
    birthday: string;
    age: number;
    zipCode: string;
    address1Kana: string;
    address1: string;
    tel1: string;
    mail1: string;
    address2Kana: string;
    address2: string;
    tel2: string;
    mail2: string;
    photo: string;
    createdAt: string;
    resume: ResumeDetails;

    constructor(data: {
        "fullname-kana": string;
        fullname: string;
        sex: string;
        birthday: string;
        age: number;
        "zip-code": string;
        "address1-kana": string;
        address1: string;
        tel1: string;
        mail1: string;
        "address2-kana": string;
        address2: string;
        tel2: string;
        mail2: string;
        photo: string;
        createdAt: string;
        resume: ResumeDetails;
    } | null = null) {
        if (!data) {
            this.fullnameKana = "";
            this.fullname = "";
            this.sex = "";
            this.birthday = "";
            this.age = 0;
            this.zipCode = "";
            this.address1Kana = "";
            this.address1 = "";
            this.tel1 = "";
            this.mail1 = "";
            this.address2Kana = "";
            this.address2 = "";
            this.tel2 = "";
            this.mail2 = "";
            this.photo = "";
            this.createdAt = "";
            this.resume = {
                education: [],
                career: [],
                license: [],
                subject: "",
                condition: "",
                hobby: "",
                reason: "",
                expectations: ""
            };
            this.fullname = ""

        } else {
            this.fullnameKana = data["fullname-kana"];
            this.fullname = data.fullname;
            this.sex = data.sex;
            this.birthday = data.birthday;
            this.age = data.age;
            this.zipCode = data["zip-code"];
            this.address1Kana = data["address1-kana"];
            this.address1 = data.address1;
            this.tel1 = data.tel1;
            this.mail1 = data.mail1;
            this.address2Kana = data["address2-kana"];
            this.address2 = data.address2;
            this.tel2 = data.tel2;
            this.mail2 = data.mail2;
            this.photo = data.photo;
            this.createdAt = data.createdAt;
            this.resume = data.resume;
        }
    }

    public isResume(obj: any): boolean {
        return (
            typeof obj === 'object' &&
            typeof obj["fullname-kana"] === 'string' &&
            typeof obj.fullname === 'string' &&
            typeof obj.sex === 'string' &&
            typeof obj.birthday === 'string' &&
            typeof obj.age === 'number' &&
            typeof obj["zip-code"] === 'string' &&
            typeof obj["address1-kana"] === 'string' &&
            typeof obj.address1 === 'string' &&
            typeof obj.tel1 === 'string' &&
            typeof obj.mail1 === 'string' &&
            typeof obj["address2-kana"] === 'string' &&
            typeof obj.address2 === 'string' &&
            typeof obj.tel2 === 'string' &&
            typeof obj.mail2 === 'string' &&
            typeof obj.photo === 'string' &&
            typeof obj.createdAt === 'string' &&
            typeof obj.resume === 'object' &&
            Array.isArray(obj.resume.education) &&
            obj.resume.education.every(isEducation) &&
            Array.isArray(obj.resume.career) &&
            obj.resume.career.every(isCareer) &&
            Array.isArray(obj.resume.license) &&
            obj.resume.license.every(isLicense) &&
            typeof obj.resume.subject === 'string' &&
            typeof obj.resume.condition === 'string' &&
            typeof obj.resume.hobby === 'string' &&
            typeof obj.resume.reason === 'string' &&
            typeof obj.resume.expectations === 'string'
        );
    }

    public static calculateAge(birthday: string): number {
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();

        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }

    public updateAge(): void {
        this.age = Resume.calculateAge(this.birthday);
    }
}
