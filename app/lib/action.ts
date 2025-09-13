"use server";

import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  id: z.string(),
  customerid: z.string({
    invalid_type_error: "Please select a customer",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please enter an invoice status",
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerid?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerid: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields, failed to create Invoice.",
    };
  }
  const { customerid, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
    INSERT INTO invoices(customer_id, amount, status, date)
    VALUES(${customerid}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (error) {
    console.error(error);
    return {
      message: "Database error: Failed to Create Invoices. ",
    };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerid, amount, status } = UpdateInvoice.parse({
    customerid: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;

  try {
    await sql`
  UPDATE invoices
  SET customer_id = ${customerid}, amount = ${amountInCents}, status = ${status}
  WHERE id = ${id}
  `;
  } catch (error) {
    console.error(error);
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices where id = ${id}`;
  } catch (error) {
    console.error(error);
  }

  revalidatePath("/dashboard/invoices");
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function signInWithGitHub(formData: FormData) {
  try {
    const redirectTo = (formData.get("redirectTo") as string) || "/dashboard";
    await signIn("github", { redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        default:
          return;
      }
    }
    throw error;
  }
}

export async function signInWithGoogle(formData: FormData) {
  try {
    const redirectTo = (formData.get("redirectTo") as string) || "/dashboard";
    await signIn("google", { redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        default:
          return;
      }
    }
    throw error;
  }
}
