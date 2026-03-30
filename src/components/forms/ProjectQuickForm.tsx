import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppStore } from "@/store";

const schema = z.object({
  name: z.string().min(1, "Required"),
  genre: z.string().optional(),
  platform: z.string().optional(),
});

export function ProjectQuickForm() {
  const addProject = useAppStore((state) => state.addProject);
  const hasHydrated = useAppStore((state) => state._hasHydrated);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", genre: "", platform: "" }
  });

  const onSubmit = (data: any) => {
    // Ép kiểu dữ liệu để chắc chắn addProject nhận được string
    addProject({
      id: `proj_${Date.now()}`,
      name: String(data.name).trim(),
      genre: String(data.genre || "").trim(),
      platform: String(data.platform || "").trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Draft",
      targetAudience: "",
    });
    reset(); // Xóa sạch form sau khi tạo thành công
  };

  if (!hasHydrated) return null;

  return (
    <form 
      className="grid gap-3 md:grid-cols-4 items-start" 
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-1">
        <input
          {...register("name")}
          className={`h-10 w-full rounded-lg border px-3 text-sm outline-none transition-all ${
            errors.name ? "border-red-500 ring-2 ring-red-100" : "border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
          }`}
          placeholder="Project name"
        />
        {errors.name && <span className="text-[10px] text-red-500 italic px-1">{errors.name.message}</span>}
      </div>

      <input
        {...register("genre")}
        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
        placeholder="Genre"
      />

      <input
        {...register("platform")}
        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
        placeholder="Platform"
      />

      <button
        type="submit"
        className="h-10 rounded-lg bg-teal-600 font-medium text-white hover:bg-teal-700 transition-colors active:scale-95"
      >
        Create
      </button>
    </form>
  );
}