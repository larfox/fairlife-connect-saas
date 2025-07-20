export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      basic_screening: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          blood_sugar: number | null
          bmi: number | null
          cholesterol: number | null
          created_at: string
          heart_rate: number | null
          height: number | null
          id: string
          notes: string | null
          oxygen_saturation: number | null
          patient_visit_id: string
          screened_by: string | null
          temperature: number | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          blood_sugar?: number | null
          bmi?: number | null
          cholesterol?: number | null
          created_at?: string
          heart_rate?: number | null
          height?: number | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          patient_visit_id: string
          screened_by?: string | null
          temperature?: number | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          blood_sugar?: number | null
          bmi?: number | null
          cholesterol?: number | null
          created_at?: string
          heart_rate?: number | null
          height?: number | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          patient_visit_id?: string
          screened_by?: string | null
          temperature?: number | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "basic_screening_patient_visit_id_fkey"
            columns: ["patient_visit_id"]
            isOneToOne: false
            referencedRelation: "patient_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "basic_screening_screened_by_fkey"
            columns: ["screened_by"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_assessments: {
        Row: {
          assessment_notes: string | null
          created_at: string
          dental_professional_id: string | null
          gum_health: string | null
          id: string
          oral_health_assessment: string | null
          patient_visit_id: string
          recommendations: string | null
          teeth_condition: string | null
          updated_at: string
        }
        Insert: {
          assessment_notes?: string | null
          created_at?: string
          dental_professional_id?: string | null
          gum_health?: string | null
          id?: string
          oral_health_assessment?: string | null
          patient_visit_id: string
          recommendations?: string | null
          teeth_condition?: string | null
          updated_at?: string
        }
        Update: {
          assessment_notes?: string | null
          created_at?: string
          dental_professional_id?: string | null
          gum_health?: string | null
          id?: string
          oral_health_assessment?: string | null
          patient_visit_id?: string
          recommendations?: string | null
          teeth_condition?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_assessments_dental_professional_id_fkey"
            columns: ["dental_professional_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_assessments_patient_visit_id_fkey"
            columns: ["patient_visit_id"]
            isOneToOne: false
            referencedRelation: "patient_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          license_number: string | null
          phone: string | null
          specialization: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          license_number?: string | null
          phone?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          license_number?: string | null
          phone?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ecg_results: {
        Row: {
          created_at: string
          id: string
          interpretation: string | null
          notes: string | null
          patient_visit_id: string
          performed_by: string | null
          result: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          interpretation?: string | null
          notes?: string | null
          patient_visit_id: string
          performed_by?: string | null
          result?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          interpretation?: string | null
          notes?: string | null
          patient_visit_id?: string
          performed_by?: string | null
          result?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecg_results_patient_visit_id_fkey"
            columns: ["patient_visit_id"]
            isOneToOne: false
            referencedRelation: "patient_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecg_results_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      event_doctors: {
        Row: {
          created_at: string
          doctor_id: string
          event_id: string
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          event_id: string
          id?: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          event_id?: string
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_doctors_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_doctors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_nurses: {
        Row: {
          created_at: string
          event_id: string
          id: string
          nurse_id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          nurse_id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          nurse_id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_nurses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_nurses_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
        ]
      }
      event_services: {
        Row: {
          created_at: string
          event_id: string
          id: string
          service_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          service_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_services_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          is_active: boolean | null
          location_id: string
          name: string
          start_time: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          is_active?: boolean | null
          location_id: string
          name: string
          start_time?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          is_active?: boolean | null
          location_id?: string
          name?: string
          start_time?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      immunizations: {
        Row: {
          administered_by: string | null
          created_at: string
          dose_number: number | null
          expiration_date: string | null
          id: string
          lot_number: string | null
          notes: string | null
          patient_visit_id: string
          site_of_injection: string | null
          updated_at: string
          vaccine_date: string | null
          vaccine_name: string
        }
        Insert: {
          administered_by?: string | null
          created_at?: string
          dose_number?: number | null
          expiration_date?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          patient_visit_id: string
          site_of_injection?: string | null
          updated_at?: string
          vaccine_date?: string | null
          vaccine_name: string
        }
        Update: {
          administered_by?: string | null
          created_at?: string
          dose_number?: number | null
          expiration_date?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          patient_visit_id?: string
          site_of_injection?: string | null
          updated_at?: string
          vaccine_date?: string | null
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "immunizations_administered_by_fkey"
            columns: ["administered_by"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immunizations_patient_visit_id_fkey"
            columns: ["patient_visit_id"]
            isOneToOne: false
            referencedRelation: "patient_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          capacity: number | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nurses: {
        Row: {
          certification_level: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          license_number: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          certification_level?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          license_number?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          certification_level?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          license_number?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      optician_assessments: {
        Row: {
          assessment_notes: string | null
          created_at: string
          eye_pressure: number | null
          id: string
          optician_id: string | null
          patient_visit_id: string
          prescription_details: string | null
          updated_at: string
          vision_test_results: string | null
        }
        Insert: {
          assessment_notes?: string | null
          created_at?: string
          eye_pressure?: number | null
          id?: string
          optician_id?: string | null
          patient_visit_id: string
          prescription_details?: string | null
          updated_at?: string
          vision_test_results?: string | null
        }
        Update: {
          assessment_notes?: string | null
          created_at?: string
          eye_pressure?: number | null
          id?: string
          optician_id?: string | null
          patient_visit_id?: string
          prescription_details?: string | null
          updated_at?: string
          vision_test_results?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "optician_assessments_optician_id_fkey"
            columns: ["optician_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optician_assessments_patient_visit_id_fkey"
            columns: ["patient_visit_id"]
            isOneToOne: false
            referencedRelation: "patient_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      pap_smear_assessments: {
        Row: {
          assessment_date: string
          comments: string | null
          created_at: string
          findings: string | null
          id: string
          patient_visit_id: string
          performed_by_doctor_id: string | null
          performed_by_nurse_id: string | null
          recommendations: string | null
          updated_at: string
        }
        Insert: {
          assessment_date?: string
          comments?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          patient_visit_id: string
          performed_by_doctor_id?: string | null
          performed_by_nurse_id?: string | null
          recommendations?: string | null
          updated_at?: string
        }
        Update: {
          assessment_date?: string
          comments?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          patient_visit_id?: string
          performed_by_doctor_id?: string | null
          performed_by_nurse_id?: string | null
          recommendations?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pap_smear_doctor"
            columns: ["performed_by_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pap_smear_nurse"
            columns: ["performed_by_nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
        ]
      }
      parishes: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_complaints: {
        Row: {
          assigned_professional_id: string | null
          complaint_text: string
          created_at: string
          id: string
          patient_visit_id: string
          severity: string | null
          updated_at: string
        }
        Insert: {
          assigned_professional_id?: string | null
          complaint_text: string
          created_at?: string
          id?: string
          patient_visit_id: string
          severity?: string | null
          updated_at?: string
        }
        Update: {
          assigned_professional_id?: string | null
          complaint_text?: string
          created_at?: string
          id?: string
          patient_visit_id?: string
          severity?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_complaints_assigned_professional_id_fkey"
            columns: ["assigned_professional_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_complaints_patient_visit_id_fkey"
            columns: ["patient_visit_id"]
            isOneToOne: false
            referencedRelation: "patient_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_prognosis: {
        Row: {
          created_at: string
          diagnosis: string | null
          doctor_id: string | null
          follow_up_notes: string | null
          follow_up_required: boolean | null
          id: string
          patient_visit_id: string
          treatment_plan: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          patient_visit_id: string
          treatment_plan?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          patient_visit_id?: string
          treatment_plan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_prognosis_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_prognosis_patient_visit_id_fkey"
            columns: ["patient_visit_id"]
            isOneToOne: false
            referencedRelation: "patient_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_visits: {
        Row: {
          basic_screening_completed: boolean | null
          created_at: string
          event_id: string
          id: string
          patient_id: string
          queue_number: number
          status: string | null
          updated_at: string
          visit_date: string
        }
        Insert: {
          basic_screening_completed?: boolean | null
          created_at?: string
          event_id: string
          id?: string
          patient_id: string
          queue_number: number
          status?: string | null
          updated_at?: string
          visit_date?: string
        }
        Update: {
          basic_screening_completed?: boolean | null
          created_at?: string
          event_id?: string
          id?: string
          patient_id?: string
          queue_number?: number
          status?: string | null
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_visits_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          allergies: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          event_id: string | null
          first_name: string
          gender: string | null
          id: string
          insurance_number: string | null
          insurance_provider: string | null
          is_active: boolean | null
          last_name: string
          medical_conditions: string | null
          medications: string | null
          parish_id: string | null
          patient_number: string | null
          phone: string | null
          town_id: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          event_id?: string | null
          first_name: string
          gender?: string | null
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          is_active?: boolean | null
          last_name: string
          medical_conditions?: string | null
          medications?: string | null
          parish_id?: string | null
          patient_number?: string | null
          phone?: string | null
          town_id?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          event_id?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          is_active?: boolean | null
          last_name?: string
          medical_conditions?: string | null
          medications?: string | null
          parish_id?: string | null
          patient_number?: string | null
          phone?: string | null
          town_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_town_id_fkey"
            columns: ["town_id"]
            isOneToOne: false
            referencedRelation: "towns"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          dosage: string | null
          duration: string | null
          frequency: string | null
          id: string
          instructions: string | null
          medication: string
          patient_visit_id: string
          prescribed_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medication: string
          patient_visit_id: string
          prescribed_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medication?: string
          patient_visit_id?: string
          prescribed_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_visit_id_fkey"
            columns: ["patient_visit_id"]
            isOneToOne: false
            referencedRelation: "patient_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_prescribed_by_fkey"
            columns: ["prescribed_by"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          organization: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          organization?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          organization?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_queue: {
        Row: {
          completed_at: string | null
          created_at: string
          doctor_id: string | null
          id: string
          nurse_id: string | null
          patient_visit_id: string
          queue_position: number | null
          service_id: string
          started_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          nurse_id?: string | null
          patient_visit_id: string
          queue_position?: number | null
          service_id: string
          started_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          nurse_id?: string | null
          patient_visit_id?: string
          queue_position?: number | null
          service_id?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_queue_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_queue_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_queue_patient_visit_id_fkey"
            columns: ["patient_visit_id"]
            isOneToOne: false
            referencedRelation: "patient_visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_queue_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          is_admin: boolean
          last_name: string
          phone: string | null
          professional_capacity:
            | Database["public"]["Enums"]["professional_capacity_enum"]
            | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_active?: boolean
          is_admin?: boolean
          last_name: string
          phone?: string | null
          professional_capacity?:
            | Database["public"]["Enums"]["professional_capacity_enum"]
            | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          is_admin?: boolean
          last_name?: string
          phone?: string | null
          professional_capacity?:
            | Database["public"]["Enums"]["professional_capacity_enum"]
            | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      staff_service_permissions: {
        Row: {
          created_at: string
          id: string
          service_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          staff_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_service_permissions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_service_permissions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      towns: {
        Row: {
          created_at: string
          id: string
          name: string
          parish_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parish_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parish_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "towns_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_patient_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      professional_capacity_enum:
        | "doctor"
        | "nurse"
        | "optician"
        | "dentist"
        | "dental_technician"
        | "registration_technician"
        | "administration"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      professional_capacity_enum: [
        "doctor",
        "nurse",
        "optician",
        "dentist",
        "dental_technician",
        "registration_technician",
        "administration",
      ],
    },
  },
} as const
