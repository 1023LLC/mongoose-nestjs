/* eslint-disable prettier/prettier */



import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";




@Schema()
export class User {
    @Prop({ required: true })
    username: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    password: string;


    @Prop({ default: false})
    isVerifiedEmail: boolean
}


export const UserSchema = SchemaFactory.createForClass(User);


