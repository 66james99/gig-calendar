# The directory structure of the gig-calendar website

The gig-calendar admin application should have:

* index.html in the root of the content tree with a link to each of the SPA for the tables in the database
* A directory off the root of the content named after the database table that has an index.html to host the SPA for that table
* Any CSS for the web site should be located in assets/css
* Any JS files should be located in assets/js with a subdirectory for each SPA for the tables
* Any JS files shared between SPA should be located in assets/js/shared
