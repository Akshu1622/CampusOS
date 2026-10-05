# M6: Hostel ER Diagram

```mermaid
erDiagram
    hostel ||--o{ room : "contains"
    
    room ||--o{ hostel_allocation : "allocated to"
    student ||--o{ hostel_allocation : "lives in"
    
    student ||--o{ hostel_request : "makes"
    user_account ||--o{ hostel_request : "reviews"
```
