# CRM Features Test Page

This test page allows you to test the new CRM features before implementing them in the live CRM.

## 🚀 **Features to Test**

### 1. **Google Places Autocomplete**
- **Purpose**: Automatically fill address fields when typing an address
- **How to Test**:
  1. Enter your Google API key in the "API Configuration" section
  2. Click "Save API Key"
  3. Go to the "Google Places Autocomplete Test" section
  4. Start typing an address in the "Street Address" field
  5. Select an address from the dropdown
  6. Verify that all address fields are automatically filled

### 2. **Real Company Lookup** ⭐ **NEW**
- **Purpose**: Search for real company information using multiple APIs
- **Data Sources**:
  - **Google Places API**: Real business listings with phone, address, website
  - **OpenCorporates API**: Registered company data with incorporation details
  - **Fallback**: Simulated data if APIs are unavailable
- **How to Test**:
  1. Go to the "Company Lookup Test" section
  2. Enter a real company name (e.g., "Microsoft", "Apple", "Starbucks")
  3. Click "Search"
  4. View real company data from multiple sources
  5. Click on a result to fill the company form
  6. Verify that real company information is populated

## 🔧 **Setup Instructions**

### Google API Key Setup (Required)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable these APIs:
   - **Places API** (required for company search)
   - **Geocoding API** (optional, for address features)
   - **Maps JavaScript API** (required for frontend autocomplete)
4. Create credentials (API Key)
5. Set up restrictions for security:
   - HTTP referrers: `your-domain.com/*`
   - IP addresses: Your server IP
6. Copy your API key
7. Set it as environment variable: `GOOGLE_API_KEY=your_key_here`
8. Paste it in the test page frontend as well

### Backend API Key Configuration
1. Copy `api-config-example.php` to `api-config.php`
2. Set your Google API key as environment variable
3. Or add it directly to the config file (less secure)
4. The backend will automatically use the environment variable

### API Key Requirements
- **Places API**: Required for company search and address autocomplete
- **Geocoding API**: Optional, for additional address features
- **Maps JavaScript API**: Required for frontend autocomplete
- **Restrictions**: Set up HTTP referrer restrictions for security

## 🧪 **Testing Scenarios**

### Address Autocomplete Testing
- ✅ Test with US addresses
- ✅ Test with Canadian addresses
- ✅ Test with partial addresses
- ✅ Test with business names
- ✅ Verify all fields are filled correctly
- ✅ Test error handling with invalid API key

### Real Company Lookup Testing
- ✅ Test with real company names (Microsoft, Apple, Starbucks)
- ✅ Test with local business names
- ✅ Verify Google Places API results (phone, address, website)
- ✅ Verify OpenCorporates API results (company registration data)
- ✅ Test source indicators ([google_places], [opencorporates])
- ✅ Verify confidence scores and match percentages
- ✅ Test form population with real data
- ✅ Test error handling and fallback to simulated data

## 📋 **Expected Behavior**

### Address Autocomplete
- **Input**: Start typing an address
- **Expected**: Dropdown appears with matching addresses
- **Selection**: Click on an address
- **Result**: All fields filled (street, city, state, postal code, country)
- **Bonus**: Phone number may be extracted if available

### Real Company Lookup
- **Input**: Enter real company name
- **Expected**: Loading spinner appears
- **Results**: Real company data from Google Places and OpenCorporates
- **Sources**: Each result shows [google_places] or [opencorporates]
- **Selection**: Click on a company
- **Result**: Real company information populated in form
- **Data**: Phone, address, website, company number, incorporation date

## 🔍 **Real Data Sources**

### Google Places API
- **Data**: Business listings, phone numbers, addresses, websites
- **Coverage**: Global business database
- **Limits**: 1,000 requests/day (free tier)
- **Best For**: Local businesses, phone numbers, addresses

### OpenCorporates API
- **Data**: Registered company information, incorporation dates
- **Coverage**: Global company registries
- **Limits**: Free tier available
- **Best For**: Corporate data, registration information

## 🐛 **Troubleshooting**

### Google Places Not Working
- Check API key is correct
- Verify Places API is enabled
- Check browser console for errors
- Ensure API key has proper restrictions
- Check server logs for backend errors

### Company Search Not Working
- Check browser console for errors
- Verify API endpoint is accessible
- Check network tab for failed requests
- Verify Google API key is set in backend
- Check server logs for API errors

### No Real Results
- Verify Google API key is configured
- Check if APIs are returning data
- Look for fallback to simulated data
- Check server error logs
- Test with different company names

### Form Not Populating
- Check JavaScript console for errors
- Verify all field IDs match
- Test with different browsers
- Check if company data structure is correct

## 🔄 **Next Steps**

Once testing is complete and working:

1. **Integrate into CRM**: Add these features to the live CRM
2. **Add More APIs**: Integrate additional company data sources
3. **Database Integration**: Save company data to database
4. **User Experience**: Add loading states and error handling
5. **Security**: Implement proper API key management
6. **Caching**: Cache API results to reduce API calls

## 📞 **Support**

If you encounter issues:
1. Check browser console for errors
2. Verify API keys are working
3. Test with different data
4. Check network connectivity
5. Review server error logs

## 🎯 **Success Criteria**

- ✅ Address autocomplete works with Google Places API
- ✅ Company search returns real data from multiple sources
- ✅ Form population works with real company data
- ✅ Error handling works properly
- ✅ UI shows data sources and confidence scores
- ✅ No console errors during normal operation
- ✅ Fallback to simulated data when APIs fail
