import { z } from "zod";

const costInput = z.object({
  item: z.string().trim().min(1, "Describe this cost"),
  amount_pkr: z.number({ message: "Enter an amount" }).min(0, "Amount cannot be negative"),
});

export const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(120, "Product name is too long"),
  description: z.string().trim().max(1000, "Description is too long").optional(),
  cost_inputs: z.array(costInput).min(1, "Add at least one cost"),
  price_pkr: z.coerce.number({ message: "Enter a price" }).positive("Price must be greater than 0"),
});

export type CostInputForm = z.infer<typeof costInput>;
export type ProductInput = z.infer<typeof productSchema>;
