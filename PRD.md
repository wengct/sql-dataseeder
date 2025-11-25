# SQL DataSeeder

## Why

產生 Insert 語法需要花不少時間，尤其是欄位很多的時候，更會耗費大量時間。因此我們需要一個工具來幫助我們快速產生 Insert 語法。

## What

SQL DataSeeder 是一個可以根據資料表結構自動產生 Insert 語法的工具。使用者只需要提供資料表名稱，SQL DataSeeder 就會自動產生對應的 Insert 語法，並且可以選擇要產生多少筆資料。

## Prerequisites

- 使用者在需要事先安裝 mssql 擴充套件（識別碼：ms-mssql.mssql），並且需要有連線到資料庫的設定。

## Features

- 使用者可以在資料表點選右鍵，會出現面版選單，選擇 "Generate Insert Scripts" 功能。
- 使用者可以選擇要產生多少筆 Insert 語法，預設為 10 筆。
- SQL DataSeeder 會使用 DML 語法查詢資料表的欄位類型，並且產生對應的假資料。
- 產生的 Insert 語法會自動複製到剪貼簿，並且顯示通知告知使用者。

## Limit

- 目前僅支援 Microsoft SQL Server 資料庫。
