"use server";

import { prisma } from "@/lib/prisma";

export async function auth(email: string, passwordInput: string) {
    const user = await prisma.user.findUnique({
        where: {
            email
        },
    });

    if (!user) {
        return {
            success: false,
            message: "User Tidak Di temukan",
        };
    }

    if (user.password !== passwordInput) {
        return {
            success: false,
            message: "Email Atau Password Salah",
        }
    }

    const { password, ...userWithoutPassword } = user;

    return {
        success: true,
        user: userWithoutPassword
    };
}
