import React, { useEffect, useState } from 'react';
// Assuming you create a new updateProfile function in your API service
import { profile, updateProfile } from '../services/api'; 
import { motion } from 'framer-motion';
import UserProfileContent from './UserProfileContent'; 

export default function Profile() {
  const [p, setP] = useState(null);
  const [draftUser, setDraftUser] = useState(null); // 🔑 NEW: State to hold editable changes
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For managing saving state

  const toggleEdit = () => {
      // When entering edit mode, initialize the draft state with the current data
      if (!isEditing) {
          setDraftUser(p);
      }
      // If cancelling edit mode, discard draft changes
      if (isEditing) {
          setDraftUser(p); 
      }
      setIsEditing(prev => !prev);
  };

  // 🔑 NEW: Function to update a field in the draft state
  const handleChange = (field, value) => {
      setDraftUser(prev => ({
          ...prev,
          [field]: value
      }));
  };

  // 🔑 NEW: Function to save changes to the backend
  const handleSave = async () => {
    if (!draftUser || !p) return; 

    setIsLoading(true);

    try {
      // 1. Call the backend API (you must implement updateProfile in '../services/api')
      const updatedData = await updateProfile(draftUser); 

      // 2. Update the main fetched state (p) with the confirmed new data
      setP(updatedData);

      // 3. Exit editing mode and reset loading state
      setIsEditing(false);
      
    } catch (err) {
      console.error("Error saving profile data:", err);
      alert("Failed to save profile changes. Please try again.");
      
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // ... (rest of your useEffect logic remains the same)
    // Removed for brevity, but includes the load() function logic
    async function load() {
      try {
        await new Promise(resolve => setTimeout(resolve, 300)); 
        const data = await profile();
        setP(data);
        setDraftUser(data); // Also initialize draft when first data is loaded
      } catch (err) { 
        console.error("Error fetching profile data:", err);
      }
    }
    load();
  }, []);


  if (!p) return (
    <div className="flex justify-center items-center min-h-screen bg-[#1a0f32] text-white">
      <div className="text-xl font-medium text-indigo-400 animate-pulse">Loading profile...</div>
    </div>
  );
  
  // Display a full-screen loading overlay while saving
  if (isLoading) return (
    <div className="fixed inset-0 flex flex-col justify-center items-center bg-[#1a0f32]/90 z-50 text-white">
        <svg className="animate-spin h-10 w-10 text-indigo-400" viewBox="0 0 24 24">...</svg>
        <div className="mt-4 text-xl">Saving changes...</div>
    </div>
  );

  return (
    <div className="flex justify-center p-0 min-h-screen bg-[#1a0f32]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <UserProfileContent 
            user={isEditing ? draftUser : p} // 🔑 PASS DRAFT: Use draftUser if editing, otherwise use p
            isEditing={isEditing} 
            toggleEdit={toggleEdit}
            handleChange={handleChange} // 🔑 NEW: Pass the change handler
            handleSave={handleSave}     // 🔑 NEW: Pass the save handler
        />
      </motion.div>
    </div>
  );
}