# The directory structure of the gig-calendar website

## Overall directory structure

The project root contains the following directories:

* docs/content
This directory contains a sub-directory for each of the static web sites associated with the project

  * admin.gig-calendar.com - content for the admin facing website for the project

  * www.gig-calendar.com - content for the public facing website for the project
  
* tools
This directory contains the code for various parts of the application, using Go for server side components, TypeScipt for client side components
  * cmds

    This directory contains code for utilities used to administer and run the application
    * email-fetcher

      A tool used to fetch emails from the email accounts used by the application to recieve information about gigs and tickets
    * finder

      A tool used to find information from various sources to populate the database tables
  * content

      This directory contains the source for SPAs for the application, written in TypeScript

    * admin.gig-calendar.com/src - code for the SPAs
    * www.gig-calendar.com/src - code for the SPAs
  * helpers

    This contains code for commands that assist in developing the application

    * goose

      A tool that wraps the goose utility fetching required credentials from Google Credential Manager
  * internal

    This contains source code of modules/libraries used with the application

    * apiHandler

        This contains the source code for the REST handlers used within the webserver
    * database

        Code for interacting with the database, primarily generated using sqlc
    * metadata

      Code used for extracting and manipulating metadata about the event, venue, performers etc being modelled in the application. A subdirectory for each type of data being models. Code common to all types is in the directory itself.
    * sql
      Location for files associated with the database

      * queries - the sql used to generate code using sqlc
      * schema - the migration files used by goose to manage the schema of the database
  * webserver
    * admin - code for the admin web server

## The gig-calendar admin application should have:

(docs/content/admin.gig-calendar.com)

* index.html in the root of the content tree with a link to each of the SPA for the tables in the database
* A directory off the root of the content named after the database table that has an index.html to host the SPA for that table
* Any CSS for the web site should be located in assets/css
* Any JS files should be located in assets/js with a subdirectory for each SPA for the tables
* Any JS files shared between SPA should be located in assets/js/shared

## Single Page Applications (SPA) for admin of database tables

(tools/content/admin.gig-calendar.com/src)

* All SPA should have a consitent look and feel.
* If the table is currently empty the SPA should report this below the row that contains the filtering options - where the rows from the database would appear
* There should be a "New" and "Refresh Table" buttons above the table where the rows from the database would appear
* After each row in the table there should be at least three buttons:

  * "Edit" - causes the that row to become an edit dialouge - ✏️ should be on that button
  * "Delete" - cause that row to be deleted - with a confirmation popup - 🗑️ should be on that button
  * "Duplicate" - causes the current row to be duplicated into a dialouge to allow a new row with that information to created - 📋

  Other buttons as required for functionality of that table

* It should be possible to sort by any of the column of the table
* It should be possible to filter on any of the columns of the table
