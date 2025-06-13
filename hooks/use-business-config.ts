"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export interface BusinessConfig {
  id?: string
  businessName: string
  rnc: string
  address: string
  phone: string
  deliveryPhone: string
  email: string
  cashierName?: string
}

const defaultConfig: BusinessConfig = {
  businessName: "Victor's Juice Co",
  rnc: "",
  address: "",
  phone: "829-222-0085",
  deliveryPhone: "829-222-0085",
  email: "info@llthermoart.com",
  cashierName: "",
}

export function useBusinessConfig() {
  const [config, setConfig] = useState<BusinessConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("business_config")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading business config:", error)
        setConfig(defaultConfig)
      } else if (data) {
        setConfig({
          id: data.id,
          businessName: data.business_name,
          rnc: data.rnc,
          address: data.address,
          phone: data.phone,
          deliveryPhone: data.delivery_phone,
          email: data.email,
          cashierName: data.cashier_name || "",
        })
      } else {
        // No hay configuración, crear una por defecto
        await createDefaultConfig()
      }
    } catch (error) {
      console.error("Error loading business config:", error)
      setConfig(defaultConfig)
    } finally {
      setIsLoading(false)
    }
  }

  const createDefaultConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("business_config")
        .insert([
          {
            business_name: defaultConfig.businessName,
            rnc: defaultConfig.rnc,
            address: defaultConfig.address,
            phone: defaultConfig.phone,
            delivery_phone: defaultConfig.deliveryPhone,
            email: defaultConfig.email,
            cashier_name: defaultConfig.cashierName,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error creating default config:", error)
      } else if (data) {
        setConfig({
          id: data.id,
          businessName: data.business_name,
          rnc: data.rnc,
          address: data.address,
          phone: data.phone,
          deliveryPhone: data.delivery_phone,
          email: data.email,
          cashierName: data.cashier_name || "",
        })
      }
    } catch (error) {
      console.error("Error creating default config:", error)
    }
  }

  const updateConfig = async (newConfig: Omit<BusinessConfig, "id">) => {
    try {
      const { data, error } = await supabase
        .from("business_config")
        .upsert(
          [
            {
              id: config.id,
              business_name: newConfig.businessName,
              rnc: newConfig.rnc,
              address: newConfig.address,
              phone: newConfig.phone,
              delivery_phone: newConfig.deliveryPhone,
              email: newConfig.email,
              cashier_name: newConfig.cashierName,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: "id" },
        )
        .select()
        .single()

      if (error) {
        console.error("Error updating business config:", error)
        throw error
      }

      if (data) {
        setConfig({
          id: data.id,
          businessName: data.business_name,
          rnc: data.rnc,
          address: data.address,
          phone: data.phone,
          deliveryPhone: data.delivery_phone,
          email: data.email,
          cashierName: data.cashier_name || "",
        })
      }

      return data
    } catch (error) {
      console.error("Error updating business config:", error)
      throw error
    }
  }

  return { config, updateConfig, isLoading, refreshConfig: loadConfig }
}
