import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getInitializedDataSource } from "@/lib/database/data-source";
import { User } from "@/lib/entities/User";
import { validate } from "class-validator";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
        return NextResponse.json({ message: "Invalid email format." }, { status: 400 });
    }
    // Basic password validation
    if (password.length < 6) {
        return NextResponse.json({ message: "Password must be at least 6 characters long." }, { status: 400 });
    }


    const dataSource = await getInitializedDataSource();
    const userRepository = dataSource.getRepository(User);

    // Check if user already exists
    const existingUser = await userRepository.findOneBy({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User();
    newUser.email = email;
    newUser.password = hashedPassword;
    if (name) {
      newUser.name = name;
    }

    // Validate the entity
    const errors = await validate(newUser);
    if (errors.length > 0) {
        console.error("Validation errors:", errors);
        return NextResponse.json({ message: "Validation failed", errors }, { status: 400 });
    }

    await userRepository.save(newUser);

    // Exclude password from the returned user object
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      { message: "User registered successfully.", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration." },
      { status: 500 }
    );
  }
}