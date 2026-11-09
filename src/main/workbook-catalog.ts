export const workbooks = {
    system1: {
        title: "System Administration I workbook",
        filename: "RHELsys1.pdf",
        release: "RHEL 9",
        pageCount: 630,
    },
    system2: {
        title: "System Administration II workbook",
        filename: "Red Hat Enterprise Linux 9.0 (RH134) - Red Hat System Administration II.pdf",
        release: "RHEL 9",
        pageCount: 434,
    },
    rhel10: {
        title: "RHEL 10 administration study guide · Asghar Ghori",
        filename:
            "_OceanofPDF.com_RHCSA_Red_Hat_Enterprise_Linux_10_Training_and_Exam_Preparation_Guide_EX200_Fourth_Edition_-_Asghar_Ghori.pdf",
        release: "RHEL 10",
        pageCount: 781,
    },
    diagnostics: {
        title: "Legacy diagnostic practice notes",
        filename: "342 test.pdf",
        release: "Legacy scenarios · 2018",
        pageCount: 8,
    },
} as const;

export type WorkbookId = keyof typeof workbooks;
