# Dhorjalgaon Connect

Build a mobile app: Create a high-utility mobile application for a village Gram Panchayat using Marathi as the primary user interface language.

The app requires two distinct user roles with specific access levels:

Citizen (Villager): Can view the home dashboard, submit problems, upvote issues, and view resolved work histories.

Panchayat Admin (Sarpanch/Gram Sevak): Can access a secure dashboard to change issue statuses, input financial expenditures, and set expected completion dates.

Build the application with the following core functional sections and modules:

HOME & ANNOUNCEMENTS (मुख्य पृष्ठ):
A digital bulletin board for official Gram Panchayat notices, scheme announcements, and meetings.
CITIZEN VOICE / PROBLEM REPORTING (समस्या नोंदवा):
A simple form with a required Category dropdown (e.g., Water, Roads, Electricity, Sanitation/कचरा व्यवस्थापन).

Photo upload feature (कैमेरा/गॅलरी) and automatic location tagging.

Optional 'Submit Anonymously' toggle to protect identity.

RESOLUTION TRACKER (विविध तक्रारींची सद्यस्थिती):
Organize issues into three clear, real-time database tabs:

Tab A: Active Problems (प्रलंबित समस्या): List of verified open issues, sorted by highest citizen upvotes, clearly showing an "Expected Resolution Date" (अंदाजे पूर्ण होण्याची तारीख).

Tab B: Work in Progress (सुरू असलेली कामे): Issues currently being worked on by the Panchayat.

Tab C: Resolved & Financial Audit Log (सोडवलेल्या समस्या आणि खर्च): Public archive of fixed problems. Each entry must list: (1) Before/After comparison photos, (2) Resolution strategy, and (3) Exact money spent from the village fund (एकूण खर्च झालेला निधी).

CIVIC IDEAS & SUGGESTIONS (नवीन कल्पना आणि सूचना):
A community brainstorming space where villagers can propose development ideas for the village. Other villagers can like/comment to show interest.
Design Considerations:

Use clean, simple, and respectful Marathi terminology.

Prioritize large typography, highly visible color-coded status tags (Red for Pending, Yellow for In Progress, Green for Completed), and icon-heavy navigation for maximum accessibility.

village name-ढोरजळगाव
taluka and district-शेवगाव
,अहिल्यानगर
sarpanch name-सुवर्णा गिऱ्हे.
dhorjalgaon grampanchayat contains sub villeges : गरडवाडी, मलकापूर, आपेगाव . make seperate sections for this village which is under this grampanchayat.
lastly add this "Developed By – Vaibhav Arun Garad"
"Email – vaibhavgarad95@gmail.com"

Add a small line below:
"For any queries, suggestions or feedback, please contact me."

Keep the existing footer design, colors, spacing, and responsive layout. Make the email clickable using a mailto link so that clicking the email opens the user's email application.
 Want this app with proper working.login page and other .make section for sarpanch and other for all villegers to keep info secure. And only i make changes in this website

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dhorjalgaon-connect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8127d031-d254-4b04-87fc-b06574404e6b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
