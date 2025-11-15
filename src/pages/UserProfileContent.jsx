import React from 'react';

// --- Helper Components ---

// DataField Component: Handles conditional rendering between input and static display
const DataField = ({ label, value, isEditing, fieldName, handleChange, type = 'text' }) => {
    // Ensure value is a string for input field display
    const fieldValue = value !== null && value !== undefined ? String(value) : ''; 

    return (
        <div className="mb-4">
            <label className="text-sm text-gray-400 mb-1 ml-1 block">{label}</label>
            {isEditing ? (
                // EDIT MODE: Render an input field
                <input
                    type={type}
                    value={fieldValue}
                    onChange={(e) => handleChange(fieldName, e.target.value)}
                    className="w-full bg-[#4a3c7c] border border-transparent focus:border-indigo-400 p-3 rounded-lg text-white font-medium focus:outline-none transition duration-150"
                    // Tailwind class to prevent appearance controls on number inputs
                    style={type === 'number' ? { 'MozAppearance': 'textfield', 'WebkitAppearance': 'none' } : {}} 
                />
            ) : (
                // VIEW MODE: Render the static value
                <div className="bg-[#4a3c7c] p-3 rounded-lg text-white font-medium">
                    {fieldValue || 'N/A'}
                </div>
            )}
        </div>
    );
};

// Card Component: Wrapper for consistent styling (Unchanged)
const Card = ({ icon, title, iconBg, iconColor, children }) => (
  <div className="bg-[rgba(40,26,70,0.6)] border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md mb-6">
    <div className="flex items-center mb-6">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 text-2xl ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
    </div>
    <div>{children}</div>
  </div>
);

// --- Main Profile Component ---

// UPDATED: Receives user data, editing state, and handlers
const UserProfileContent = ({ user, isEditing, toggleEdit, handleChange, handleSave }) => {
  if (!user) return null;

  // Formatting helpers
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Unknown';
  const accountCreated = user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A';
  
  // Note: DOB field requires careful handling of the date format for input type="date"
  const dobValue = user.dob ? (user.dob.split('T')[0] || user.dob) : '';
  const dobDisplay = dobValue ? new Date(dobValue).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  
  const fullAddress = `${user.street || ''}, ${user.city || ''}, ${user.state || ''}, ${user.country || ''}`.replace(/,\s*,/g, ',').trim().replace(/^,/, '').trim();
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('') : user.username ? user.username.slice(0, 2).toUpperCase() : 'AM';

  // Function to render the correct value (display or input) for Contact/Security cards
  const RenderValue = ({ fieldName, value, type = 'text', readOnly = false }) => (
    isEditing && !readOnly ? (
        <input
            type={type}
            value={value || ''}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            className="w-full bg-transparent text-white font-medium focus:outline-none text-right"
        />
    ) : (
        <span className="text-white font-medium">{value || 'N/A'}</span>
    )
  );

  return (
    <div className="profile-container max-w-7xl mx-auto p-4 md:p-8">
      
      {/* --- 1. Profile Header --- */}
      <header className="flex flex-col md:flex-row items-center mb-8 relative py-4">
        
        {/* Avatar */}
        <div className="relative mr-0 md:mr-6 mb-4 md:mb-0">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-pink-500 flex items-center justify-center text-4xl font-semibold border-4 border-[#1a0f32]">
            {initials}
          </div>
          <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-xl border-4 border-[#1a0f32]">
            ⚡
          </div>
        </div>

        {/* User Info */}
        <div className="flex-grow text-center md:text-left">
          <h1 className="text-3xl font-bold">{user.name || user.username}</h1>
          <div className="flex items-center justify-center md:justify-start gap-4 text-gray-400 my-1">
            <span>@{user.username}</span>
            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md text-xs font-medium">
              ID: {user.user_id || 'N/A'}
            </span>
          </div>
          <div className="text-gray-400 text-sm">Member since {memberSince}</div>
          
          {isEditing && (
            <span className="mt-2 text-sm text-yellow-400 font-semibold border border-yellow-400/50 px-2 py-1 rounded-lg inline-block">
                EDITING MODE
            </span>
          )}
        </div>

        {/* Edit/Save Button Container */}
        <div className="mt-4 md:mt-0 md:ml-auto flex gap-4">
            
            {isEditing && (
                // Save button
                <button 
                    onClick={handleSave}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:-translate-y-0.5"
                >
                    Save Changes
                </button>
            )}

            <button
                onClick={toggleEdit}
                className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:-translate-y-0.5 ${
                    isEditing 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gradient-to-r from-blue-400 to-pink-500 text-white hover:shadow-lg hover:shadow-pink-500/40' 
                }`}
            >
                {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
        </div>
      </header>

      {/* --- 2. Profile Body (2-Column Grid) --- */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* --- Column 1: Left --- */}
        <div>
          {/* Personal Info Card - FULLY EDITABLE */}
          <Card icon="👤" title="Personal Information" iconBg="bg-purple-500/20" iconColor="text-purple-400">
            <DataField 
                label="Full Name" 
                value={user.name} 
                isEditing={isEditing} 
                fieldName="name" 
                handleChange={handleChange} 
            />

            <div className="grid grid-cols-2 gap-4">
              <DataField 
                label="Gender" 
                value={user.gender} 
                isEditing={isEditing} 
                fieldName="gender" 
                handleChange={handleChange} 
              />
              <DataField 
                label="Age" 
                value={user.age} 
                isEditing={isEditing} 
                fieldName="age" 
                handleChange={handleChange} 
                type="number" 
              />
            </div>
            
            <DataField 
                label="Date of Birth" 
                value={isEditing ? dobValue : dobDisplay} // Use simple format for input, display format for view
                isEditing={isEditing} 
                fieldName="dob" 
                handleChange={handleChange} 
                type="date" 
            />
          </Card>

          {/* Address Details Card - FULLY EDITABLE */}
          <Card icon="📍" title="Address Details" iconBg="bg-pink-500/20" iconColor="text-pink-400">
            <DataField 
                label="Street Address" 
                value={user.street} 
                isEditing={isEditing} 
                fieldName="street" 
                handleChange={handleChange} 
            />
            <div className="grid grid-cols-2 gap-4">
              <DataField 
                label="City" 
                value={user.city} 
                isEditing={isEditing} 
                fieldName="city" 
                handleChange={handleChange} 
              />
              <DataField 
                label="State" 
                value={user.state} 
                isEditing={isEditing} 
                fieldName="state" 
                handleChange={handleChange} 
              />
            </div>
            <DataField 
                label="Country" 
                value={user.country} 
                isEditing={isEditing} 
                fieldName="country" 
                handleChange={handleChange} 
            />
            <DataField 
                label="Complete Address" 
                value={fullAddress} 
                isEditing={false} // This field is read-only (concatenated)
                fieldName="fullAddressDisplay" 
                handleChange={handleChange}
            />
          </Card>
        </div>

        {/* --- Column 2: Right --- */}
        <div>
          {/* Contact Info Card - EDITABLE */}
          <Card icon="📞" title="Contact Information" iconBg="bg-blue-500/20" iconColor="text-blue-400">
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-1 ml-1 block">Mobile Number</label>
              <div className="flex justify-between items-center bg-[#4a3c7c] p-3 rounded-lg">
                <RenderValue fieldName="mobile_no" value={user.mobile_no} isEditing={isEditing} handleChange={handleChange} type="tel" />
                {!isEditing && <span className="text-blue-400 text-sm font-medium cursor-pointer">Call</span>}
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-1 ml-1 block">Email Address</label>
              <div className="flex justify-between items-center bg-[#4a3c7c] p-3 rounded-lg">
                <RenderValue fieldName="email" value={user.email} isEditing={isEditing} handleChange={handleChange} type="email" />
                {!isEditing && <span className="text-blue-400 text-sm font-medium cursor-pointer">Send</span>}
              </div>
            </div>
            <DataField 
                label="Communication Preferences" 
                value="Receive confirmations, updates, and special offers via email and SMS." 
                isEditing={false} // This field is static
                fieldName="prefs" 
                handleChange={handleChange}
            />
          </Card>

          {/* Account Security Card - READ ONLY */}
          <Card icon="🛡️" title="Account Security" iconBg="bg-orange-500/20" iconColor="text-orange-400">
            <div className="space-y-4">
              {/* Username */}
              <div className="flex justify-between items-center bg-[#4a3c7c] p-4 rounded-lg">
                <div className="flex items-center">
                  <span className="text-blue-400 text-xl mr-3">👤</span>
                  <div>
                    <div className="font-medium">Username</div>
                    <div className="text-sm text-gray-400">@{user.username}</div>
                  </div>
                </div>
                <span className="text-green-500 text-sm font-medium">✓ Verified</span>
              </div>
              
              {/* Password (The change button is static as it requires a different modal/form) */}
              <div className="flex justify-between items-center bg-[#4a3c7c] p-4 rounded-lg">
                <div className="flex items-center">
                  <span className="text-purple-400 text-xl mr-3">🔒</span>
                  <div>
                    <div className="font-medium">Password</div>
                    <div className="text-sm text-gray-400">Last changed 45 days ago</div>
                  </div>
                </div>
                <button className="bg-white/10 px-3 py-1 rounded-md text-sm hover:bg-white/20">Change</button>
              </div>

              {/* Account Created */}
              <div className="flex justify-between items-center bg-[#4a3c7c] p-4 rounded-lg">
                <div className="flex items-center">
                  <span className="text-orange-400 text-xl mr-3">🕒</span>
                  <div>
                    <div className="font-medium">Account Created</div>
                    <div className="text-sm text-gray-400">{accountCreated}</div>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500 text-green-400 p-4 rounded-lg text-center mt-6">
                <strong className="font-bold block text-base">Account Security: Strong</strong>
                <span className="text-sm">Your account is protected with verified email and mobile number.</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UserProfileContent;