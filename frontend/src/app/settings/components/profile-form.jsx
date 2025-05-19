"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

const profileFormSchema = z.object({
  nickname: z
    .string()
    .min(2, {
      message: "닉네임은 최소 2자 이상이어야 합니다.",
    })
    .max(20, {
      message: "닉네임은 최대 20자까지 가능합니다.",
    })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: "영문, 숫자, 밑줄(_), 하이픈(-)만 사용 가능합니다.",
    }),
})

export function ProfileForm() {
  const { data: session, update: updateSession } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nickname: session?.user?.nickname || "",
    },
  })

  async function onSubmit(values) {
    try {
      const response = await fetch("/api/user/nickname", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname: values.nickname }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message)
      }

      await updateSession({
        user: {
          ...session?.user,
          nickname: values.nickname,
        },
      })

      setIsEditing(false)
      toast({
        title: "프로필이 업데이트되었습니다.",
        description: "닉네임이 성공적으로 업데이트되었습니다.",
      })
    } catch (error) {
      toast({
        title: "프로필 업데이트에 실패했습니다.",
        description: error.message,
      })
    }
  }

  const handleCancel = () => {
    form.reset()
    setIsEditing(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>닉네임</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input 
                    placeholder="닉네임을 입력하세요" 
                    {...field} 
                    value={field.value || session?.user?.nickname || ""}
                    disabled={!isEditing}
                    className="flex-1"
                  />
                </FormControl>
                {!isEditing ? (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    변경
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      type="submit"
                      variant="default"
                    >
                      저장
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      취소
                    </Button>
                  </div>
                )}
              </div>
              <FormDescription>
                이 닉네임은 블로그에 사용됩니다.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
} 